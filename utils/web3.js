'use strict';

/**
 * Minimal Ethereum JSON-RPC helpers used by the token balance endpoint.
 *
 * We avoid pulling in ethers/web3 because the bounty asks for a single
 * endpoint and the surface area we need is tiny: validate an address,
 * fetch ERC-20 metadata (symbol/name/decimals), and read balanceOf.
 */

const DEFAULT_RPC_URL =
  process.env.ETH_RPC_URL ||
  process.env.ETHEREUM_RPC_URL ||
  'https://cloudflare-eth.com';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isValidAddress(address) {
  return typeof address === 'string' && ADDRESS_RE.test(address);
}

function normalizeAddress(address) {
  return String(address).toLowerCase();
}

function toBigInt(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.length > 0) {
    // Accept both decimal ("123") and hex ("0xff") inputs.
    return value.startsWith('0x') || value.startsWith('0X')
      ? BigInt(value)
      : BigInt(value);
  }
  return 0n;
}

/**
 * Render a raw uint256 balance to a human-readable decimal string given the
 * token's decimals. Handles negative balances (which are valid in uint256 but
 * not on ERC-20, so we still emit a leading minus).
 */
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

function pad32(hexNoPrefix) {
  return hexNoPrefix.toLowerCase().padStart(64, '0');
}

function encodeBalanceOf(walletAddress) {
  const body = walletAddress.replace(/^0x/i, '');
  return '0x70a08231' + pad32(body);
}

function readDynamicString(hex) {
  try {
    const offset = Number(BigInt('0x' + hex.slice(0, 64)));
    if (
      Number.isSafeInteger(offset) &&
      offset >= 0 &&
      offset * 2 + 64 <= hex.length
    ) {
      const length = Number(
        BigInt('0x' + hex.slice(offset * 2, offset * 2 + 64))
      );
      const start = offset * 2 + 64;
      const end = start + length * 2;
      if (Number.isSafeInteger(length) && end <= hex.length) {
        return Buffer.from(hex.slice(start, end), 'hex')
          .toString('utf8')
          .replace(/\0+$/, '');
      }
    }
  } catch (_) {
    // Fall through to bytes32 interpretation below.
  }
  return '';
}

function decodeString(result) {
  const hex = String(result || '').replace(/^0x/, '');
  if (!hex) return '';

  const dynamic = readDynamicString(hex);
  if (dynamic) return dynamic;

  return Buffer.from(hex.slice(0, 64), 'hex')
    .toString('utf8')
    .replace(/\0+$/, '');
}

function decodeUint256(result) {
  return toBigInt(result || '0x0');
}

async function rpcCall(method, params, rpcUrl = DEFAULT_RPC_URL) {
  if (typeof fetch !== 'function') {
    const error = new Error('Node.js 18+ required for built-in fetch.');
    error.code = 'CONFIGURATION_ERROR';
    throw error;
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
    const error = new Error('RPC request failed with HTTP ' + response.status);
    error.statusCode = 502;
    throw error;
  }

  const payload = await response.json();
  if (payload.error) {
    const error = new Error(payload.error.message || 'RPC request failed');
    error.statusCode = 502;
    throw error;
  }

  return payload.result;
}

const SELECTORS = {
  symbol: '0x95d89b41',
  name: '0x06fdde03',
  decimals: '0x313ce567',
  balanceOf: '0x70a08231'
};

async function readTokenMetadata(contractAddress, rpcUrl, options = {}) {
  const calls = await Promise.allSettled([
    rpcCall(
      'eth_call',
      [{ to: contractAddress, data: SELECTORS.symbol }, 'latest'],
      rpcUrl
    ),
    rpcCall(
      'eth_call',
      [{ to: contractAddress, data: SELECTORS.name }, 'latest'],
      rpcUrl
    ),
    rpcCall(
      'eth_call',
      [{ to: contractAddress, data: SELECTORS.decimals }, 'latest'],
      rpcUrl
    )
  ]);

  const symbol =
    options.symbol ||
    (calls[0].status === 'fulfilled' ? decodeString(calls[0].value) : '') ||
    'UNKNOWN';
  const name =
    options.name ||
    (calls[1].status === 'fulfilled' ? decodeString(calls[1].value) : '') ||
    symbol;
  const rawDecimals =
    options.decimals ??
    (calls[2].status === 'fulfilled'
      ? Number(decodeUint256(calls[2].value))
      : 18);
  const decimals = Number.isFinite(Number(rawDecimals))
    ? Number(rawDecimals)
    : 18;

  return { symbol, name, decimals };
}

function parseJsonEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    const err = new Error('Invalid JSON in ' + name + ': ' + error.message);
    err.code = 'CONFIGURATION_ERROR';
    err.statusCode = 503;
    throw err;
  }
}

function configuredTokens() {
  const configured = parseJsonEnv('TOKEN_CONTRACTS_JSON', []);
  if (!Array.isArray(configured)) return [];
  return configured
    .map((entry) => {
      if (typeof entry === 'string') return { contractAddress: entry };
      if (entry && typeof entry === 'object') {
        const address = entry.contractAddress || entry.address;
        return address ? { ...entry, contractAddress: address } : null;
      }
      return null;
    })
    .filter((entry) => entry && isValidAddress(entry.contractAddress));
}

async function readBalance(rpcUrl, contractAddress, walletAddress) {
  const result = await rpcCall(
    'eth_call',
    [
      { to: contractAddress, data: encodeBalanceOf(walletAddress) },
      'latest'
    ],
    rpcUrl
  );
  return decodeUint256(result);
}

async function getTokenBalances(walletAddress, options = {}) {
  if (!isValidAddress(walletAddress)) {
    const error = new Error('Invalid Ethereum wallet address');
    error.statusCode = 400;
    throw error;
  }

  const rpcUrl = options.rpcUrl || DEFAULT_RPC_URL;
  const includeZero = options.includeZero === true;
  const tokens = configuredTokens();

  const entries = [];
  for (const token of tokens) {
    const contractAddress = normalizeAddress(token.contractAddress);
    const rawBalance = await readBalance(rpcUrl, contractAddress, walletAddress);
    if (rawBalance === 0n && !includeZero) continue;

    const metadata = await readTokenMetadata(contractAddress, rpcUrl, token);
    entries.push({
      contractAddress,
      rawBalance: rawBalance.toString(),
      balance: formatUnits(rawBalance, metadata.decimals),
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: metadata.decimals,
      coingeckoId: token.coingeckoId || null
    });
  }

  return entries;
}

module.exports = {
  ADDRESS_RE,
  DEFAULT_RPC_URL,
  decodeString,
  decodeUint256,
  formatUnits,
  getTokenBalances,
  isValidAddress,
  normalizeAddress,
  pad32,
  readBalance,
  readTokenMetadata,
  rpcCall
};