const PRICE_CACHE = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

const getTokenPrice = async (symbol) => {
  const now = Date.now();
  const cached = PRICE_CACHE.get(symbol);
  if (cached && (now - cached.ts) < CACHE_TTL) return cached.data;

  try {
    const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + getCoingeckoId(symbol) + '&vs_currencies=sgd,usd');
    const data = await resp.json();
    const id = getCoingeckoId(symbol);
    const price = data[id] || { sgd: 0, usd: 0 };
    PRICE_CACHE.set(symbol, { data: price, ts: now });
    return price;
  } catch {
    return { sgd: 0, usd: 0 };
  }
};

const getCoingeckoId = (symbol) => {
  const map = { 'ETH':'ethereum','USDC':'usd-coin','USDT':'tether','BTC':'bitcoin','XMR':'monero' };
  return map[symbol?.toUpperCase()] || symbol?.toLowerCase() || 'unknown';
};

const formatCurrency = (value, currency) => {
  const sym = currency === 'SGD' ? 'S$' : '$';
  return sym + Number(value).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
};

module.exports = { getTokenPrice, formatCurrency };
