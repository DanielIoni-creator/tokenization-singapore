// utils/priceService.js
const axios = require('axios');

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const cache = new Map();
const CACHE_TTL_MS = 60000;

async function getTokenPrice(symbol) {
  const cacheKey = symbol.toUpperCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const coinId = getCoinGeckoId(symbol);
    if (!coinId) {
      return { usd: 0, sgd: 0 };
    }

    const response = await axios.get(`${COINGECKO_BASE}/simple/price`, {
      params: { ids: coinId, vs_currencies: 'usd,sgd' },
      timeout: 5000
    });

    const prices = response.data[coinId] || { usd: 0, sgd: 0 };
    const result = { usd: prices.usd || 0, sgd: prices.sgd || 0 };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`Price fetch failed for ${symbol}:`, error.message);
    return { usd: 0, sgd: 0 };
  }
}

function getCoinGeckoId(symbol) {
  const map = {
    'ETH': 'ethereum', 'WETH': 'weth', 'USDC': 'usd-coin', 'USDT': 'tether',
    'DAI': 'dai', 'WBTC': 'wrapped-bitcoin', 'MATIC': 'matic-network',
    'POL': 'polygon-ecosystem-token', 'LINK': 'chainlink', 'UNI': 'uniswap',
    'AAVE': 'aave', 'MKR': 'maker', 'SNX': 'havven', 'COMP': 'compound-governance-token',
    'CRV': 'curve-dao-token', 'SUSHI': 'sushi', '1INCH': '1inch',
    'ENS': 'ethereum-name-service', 'GRT': 'the-graph', 'BAT': 'basic-attention-token',
    'ZRX': '0x', 'MANA': 'decentraland', 'SAND': 'the-sandbox',
    'AXS': 'axie-infinity', 'GALA': 'gala', 'ENJ': 'enjincoin', 'CHZ': 'chiliz',
    'LRC': 'loopring', 'REN': 'republic-protocol', 'STORJ': 'storj', 'ANKR': 'ankr',
    'CRO': 'crypto-com-chain', 'FTM': 'fantom', 'AVAX': 'avalanche-2',
    'SOL': 'solana', 'DOT': 'polkadot', 'ADA': 'cardano', 'XRP': 'ripple',
    'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'XLM': 'stellar', 'ALGO': 'algorand',
    'ATOM': 'cosmos', 'FIL': 'filecoin', 'NEAR': 'near', 'ARB': 'arbitrum',
    'OP': 'optimism', 'APT': 'aptos', 'SUI': 'sui', 'SEI': 'sei-network',
    'TIA': 'celestia', 'STRK': 'starknet', 'PEPE': 'pepe', 'SHIB': 'shiba-inu',
    'BONK': 'bonk', 'FLOKI': 'floki', 'WIF': 'dogwifcoin'
  };
  return map[symbol.toUpperCase()] || null;
}

function formatCurrency(value, currency) {
  const locale = currency === 'SGD' ? 'en-SG' : 'en-US';
  const symbol = currency === 'SGD' ? 'S$' : '$';
  return `${symbol}${value.toLocaleString(locale, {
    minimumFractionDigits: 2, maximumFractionDigits: 6
  })}`;
}

module.exports = { getTokenPrice, getCoinGeckoId, formatCurrency };