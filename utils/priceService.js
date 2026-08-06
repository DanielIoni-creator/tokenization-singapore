'use strict';

const DEFAULT_PRICE_API =
  process.env.COINGECKO_API_URL ||
  'https://api.coingecko.com/api/v3';

function parseJsonEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function configuredPrices() {
  return parseJsonEnv('TOKEN_PRICE_DATA_JSON', {});
}

function configuredPriceIds() {
  return parseJsonEnv('TOKEN_PRICE_IDS_JSON', {});
}

async function getTokenPrices(tokens, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const prices = new Map();

  if (!Array.isArray(tokens) || tokens.length === 0) return prices;

  const addresses = tokens
    .map((token) => String(token.contractAddress || '').toLowerCase())
    .filter(Boolean);

  let remotePrices = {};

  if (typeof fetchImpl === 'function' && addresses.length > 0) {
    try {
      const url = new URL(
        '/simple/token_price/ethereum',
        DEFAULT_PRICE_API.endsWith('/') ? DEFAULT_PRICE_API : DEFAULT_PRICE_API + '/'
      );
      url.searchParams.set('contract_addresses', addresses.join(','));
      url.searchParams.set('vs_currencies', 'usd,sgd');

      const response = await fetchImpl(url, {
        headers: { accept: 'application/json' }
      });

      if (response.ok) remotePrices = await response.json();
    } catch (error) {
      remotePrices = {};
    }
  }

  const fallbackPrices = configuredPrices();
  const fallbackIds = configuredPriceIds();

  for (const token of tokens) {
    const address = String(token.contractAddress || '').toLowerCase();
    const remote = remotePrices[address] || {};
    const fallback =
      fallbackPrices[address] ||
      fallbackPrices[token.symbol] ||
      (token.coingeckoId && fallbackPrices[token.coingeckoId]) ||
      {};
    const priceId = token.coingeckoId || fallbackIds[address];

    let price = {
      usd: finiteNumber(remote.usd ?? fallback.usd ?? fallback.priceUsd),
      sgd: finiteNumber(remote.sgd ?? fallback.sgd ?? fallback.priceSgd),
      source: remote.usd || remote.sgd ? 'coingecko' : 'configured'
    };

    if (
      price.usd === null &&
      price.sgd === null &&
      priceId &&
      typeof fetchImpl === 'function'
    ) {
      try {
        const url = new URL(
          '/simple/price',
          DEFAULT_PRICE_API.endsWith('/') ? DEFAULT_PRICE_API : DEFAULT_PRICE_API + '/'
        );
        url.searchParams.set('ids', priceId);
        url.searchParams.set('vs_currencies', 'usd,sgd');

        const response = await fetchImpl(url, {
          headers: { accept: 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const byId = data[priceId] || {};
          price = {
            usd: finiteNumber(byId.usd),
            sgd: finiteNumber(byId.sgd),
            source: 'coingecko'
          };
        }
      } catch (error) {
        // A price outage must not make the balance endpoint unusable.
      }
    }

    if (price.sgd === null && price.usd !== null) {
      const usdSgdRate = finiteNumber(process.env.USD_SGD_RATE);
      if (usdSgdRate !== null) price.sgd = price.usd * usdSgdRate;
    }

    prices.set(address, price);
  }

  return prices;
}

module.exports = {
  getTokenPrices
};
