'use strict';

/**
 * Token price lookup.
 *
 * Tries CoinGecko's free `simple/token_price/ethereum` endpoint first; falls
 * back to a static JSON map configured via the TOKEN_PRICE_DATA_JSON env var
 * so the endpoint still works in offline test or local dev setups.
 */

const DEFAULT_PRICE_API =
  process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

function parseJsonEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function finiteNumber(value) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function joinUrl(base, path) {
  const trimmed = String(base).replace(/\/+$/, '');
  return trimmed + '/' + String(path).replace(/^\/+/, '');
}

async function fetchCoinGeckoTokenPrices(addresses, fetchImpl) {
  if (!Array.isArray(addresses) || addresses.length === 0) return {};
  if (typeof fetchImpl !== 'function') return {};

  const url = new URL(joinUrl(DEFAULT_PRICE_API, 'simple/token_price/ethereum'));
  url.searchParams.set('contract_addresses', addresses.join(','));
  url.searchParams.set('vs_currencies', 'usd,sgd');

  try {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' }
    });
    if (!response || !response.ok) return {};
    return await response.json();
  } catch (_) {
    return {};
  }
}

function buildFallbackLookup() {
  const byAddress = parseJsonEnv('TOKEN_PRICE_DATA_JSON', {});
  const byId = parseJsonEnv('TOKEN_PRICE_IDS_JSON', {});
  return { byAddress, byId };
}

function lookupFallbackPrice(addressLower, symbol, fallback) {
  const fromAddress = fallback.byAddress[addressLower];
  if (fromAddress) return fromAddress;

  const fromSymbol = symbol && fallback.byAddress[symbol];
  if (fromSymbol) return fromSymbol;

  return null;
}

function applyUsdSgdRate(price, usdSgdRate) {
  if (price.sgd !== null || price.usd === null) return price;
  if (usdSgdRate === null) return price;
  return { ...price, sgd: price.usd * usdSgdRate };
}

/**
 * @param {Array<{contractAddress:string,symbol?:string,coingeckoId?:string}>} tokens
 * @param {{fetchImpl?:Function}} [options]
 * @returns {Promise<Map<string,{usd:number|null,sgd:number|null,source:string}>>}
 */
async function getTokenPrices(tokens, options = {}) {
  const fetchImpl = options.fetchImpl;
  const fallback = buildFallbackLookup();
  const usdSgdRate = finiteNumber(process.env.USD_SGD_RATE);
  const result = new Map();

  if (!Array.isArray(tokens) || tokens.length === 0) return result;

  const addresses = tokens
    .map((token) => String(token.contractAddress || '').toLowerCase())
    .filter(Boolean);

  let remotePrices = {};
  if (typeof fetchImpl === 'function' && addresses.length > 0) {
    remotePrices = await fetchCoinGeckoTokenPrices(addresses, fetchImpl);
  }

  for (const token of tokens) {
    const addressLower = String(token.contractAddress || '').toLowerCase();
    const remote = remotePrices[addressLower] || {};
    const local = lookupFallbackPrice(addressLower, token.symbol, fallback);

    let price = {
      usd: finiteNumber(remote.usd ?? (local && (local.usd ?? local.priceUsd))),
      sgd: finiteNumber(remote.sgd ?? (local && (local.sgd ?? local.priceSgd))),
      source: remote.usd !== undefined || remote.sgd !== undefined
        ? 'coingecko'
        : local
        ? 'configured'
        : 'unavailable'
    };

    if (price.sgd === null && price.usd !== null && usdSgdRate !== null) {
      price = applyUsdSgdRate(price, usdSgdRate);
    }

    result.set(addressLower, price);
  }

  return result;
}

module.exports = {
  DEFAULT_PRICE_API,
  fetchCoinGeckoTokenPrices,
  getTokenPrices
};