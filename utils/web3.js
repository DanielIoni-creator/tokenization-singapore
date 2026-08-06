'use strict';

const DEFAULT_RPC_URL =
  process.env.ETH_RPC_URL ||
  process.env.ETHEREUM_RPC_URL ||
  'https://cloudflare-eth.com';

function configurationError(message) {
  const error = new Error(message);
  error.code = 'CONFIGURATION_ERROR';
  return error;
}

function parseJsonEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    throw configurationError('Invalid JSON in ' + name + ': ' + error.message);
  }
}

function isValidAddress(address) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

function normalizeAddress(address) {
  return address.toLowerCase();
}

function toBigInt(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.length > 0) {
    return BigInt(value);
  }
  return 0n;
}

function formatUnits(value, decimals) {
  const raw = toBigInt(value);
  const places = Math.max(0, Number(decimals) || 0);

  if (places === 0) return raw.toString();

  const negative = raw < 0n;
  const absolute = negative ? -raw : raw;
  const digits = absolute.toString().padStart(places + 1, '0');
  const splitAt = digits.length - places;
  const whole = digits.slice(0, splitAt);
  const fraction = digits.slice(splitAt).replace(/0+$/, '');
  const formatted = fraction ? whole + '.' + fraction : whole;

  return negative ? '-' + formatted : formatted;
}

async function rpcCall(method, params, rpcUrl = DEFAULT_RPC_URL) {
  if (typeof fetch !== 'function') {
    throw configurationError('This endpoint requires Node.js 18 or newer.');
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error('RPC request failed with HTTP ' + response.status);
  }

  const payload = await response.json();

  if (payload.error) {
    throw new Error(payload.error.message || 'RPC request failed');
  }

  return payload.result;
}

function encodeBalanceOf(walletAddress) {
  return '0x70a08231' + walletAddress.slice(2).padStart(64, '0');
}

function decodeUint256(result) {
  return toBigInt(result || '0x0');
}

function decodeText(result) {
  const hex = String(result || '').replace(/^0x/, '');
  if (!hex) return '';

  try {
    const firstWord = BigInt('0x' + hex.slice(0, 64));
    const dynamicOffset = Number(firstWord);

    if (
      Number.isSafeInteger(dynamicOffset) &&
      dynamicOffset >= 0 &&
      dynamicOffset * 2 + 64 <= hex.length
    ) {
      const length = Number(
        BigInt('0x' + hex.slice(dynamicOffset * 2, dynamicOffset * 2 + 64))
      );
      const start = dynamicOffset * 2 + 64;
      const end = start + length * 2;

      if (Number.isSafeInteger(length) && end <= hex.length) {
        return Buffer.from(hex.slice(start, end), 'hex')
          .toString('utf8')
          .replace(/\0+$/, '');
      }
    }
  } catch (error) {
    // Some ERC-20 contracts return bytes32 instead of a dynamic string.
  }

  const bytes32 = Buffer.from(hex.slice(0, 64), 'hex')
    .toString('utf8')
    .replace(/\0+$/, '');

  return bytes32;
}

async function readTokenMetadata(contractAddress, rpcUrl, configured = {}) {
  const calls = await Promise.allSettled([
    rpcCall('eth_call', [{ to: contractAddress, data: '0x95d89b41' }, 'latest'], rpcUrl),
    rpcCall('eth_call', [{ to: contractAddress, data: '0x06fdde03' }, 'latest'], rpcUrl),
    rpcCall('eth_call', [{ to: contractAddress, data: '0x313ce567' }, 'latest'], rpcUrl)
  ]);

  const symbol =
    configured.symbol ||
    (calls[0].status === 'fulfilled' ? decodeText(calls[0].value) : '') ||
    'UNKNOWN';
  const name =
    configured.name ||
    (calls[1].status === 'fulfilled' ? decodeText(calls[1].value) : '') ||
    symbol;
  const decimals =
    configured.decimals ??
    (calls[2].status === 'fulfilled'
      ? Number(decodeUint256(calls[2].value))
      : 18);

  return {
    symbol,
    name,
    decimals: Number.isFinite(Number(decimals)) ? Number(decimals) : 18
  };
}

function configuredTokens() {
  const configured = parseJsonEnv(
    'TOKEN_CONTRACTS_JSON',
    parseJsonEnv('SUPPORTED_TOKENS_JSON', [])
  );

  if (!Array.isArray(configured)) return [];

  return configured
    .map((token) => {
      if (typeof token === 'string') return { contractAddress: token };
      return token && typeof token === 'object' ? token : null;
    })
    .filter(
      (token) =>
        token &&
        isValidAddress(token.contractAddress || token.address)
    )
    .map((token) => ({
      ...token,
      contractAddress: token.contractAddress || token.address
    }));
}

async function readConfiguredBalances(walletAddress, rpcUrl) {
  const entries = [];

  for (const configured of configuredTokens()) {
    const contractAddress = configured.contractAddress;
    const result = await rpcCall(
      'eth_call',
      [{ to: contractAddress, data: encodeBalanceOf(walletAddress) }, 'latest'],
      rpcUrl
    );
    const rawBalance = decodeUint256(result);

    if (rawBalance === 0n && configured.includeZero !== true) continue;

    const metadata = await readTokenMetadata(
      contractAddress,
      rpcUrl,
      configured
    );

    entries.push({
      contractAddress,
      rawBalance: rawBalance.toString(),
      balance: formatUnits(rawBalance, metadata.decimals),
      ...metadata,
      coingeckoId: configured.coingeckoId
    });
  }

  return entries;
}

async function readAlchemyBalances(walletAddress, rpcUrl) {
  const result = await rpcCall(
    'alchemy_getTokenBalances',
    [walletAddress, 'erc20'],
    rpcUrl
  );

  const tokenBalances = Array.isArray(result && result.tokenBalances)
    ? result.tokenBalances
    : [];

  const entries = [];

  for (const token of tokenBalances) {
    if (!token || !isValidAddress(token.contractAddress)) continue;

    const rawBalance = decodeUint256(token.tokenBalance || '0x0');
    if (rawBalance === 0n) continue;

    const metadata = await readTokenMetadata(
      token.contractAddress,
      rpcUrl,
      token
    );

    entries.push({
      contractAddress: token.contractAddress,
      rawBalance: rawBalance.toString(),
      balance: formatUnits(rawBalance, metadata.decimals),
      ...metadata
    });
  }

  return entries;
}

async function getTokenBalances(walletAddress) {
  if (!isValidAddress(walletAddress)) {
    const error = new Error('Invalid Ethereum wallet address');
    error.statusCode = 400;
    throw error;
  }

  const alchemyRpcUrl = process.env.ALCHEMY_RPC_URL;
  if (alchemyRpcUrl) {
    try {
      return await readAlchemyBalances(walletAddress, alchemyRpcUrl);
    } catch (error) {
      if (configuredTokens().length === 0) throw error;
    }
  }

  return readConfiguredBalances(walletAddress, DEFAULT_RPC_URL);
}

module.exports = {
  DEFAULT_RPC_URL,
  decodeText,
  formatUnits,
  getTokenBalances,
  isValidAddress,
  rpcCall
};
