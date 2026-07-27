// Price Service Utility for Token Pricing in USD and SGD
const SGD_PER_USD = 1.35; // Default SGD exchange rate

exports.getTokenPrices = async (symbol) => {
  // Mock price feeds for real estate token assets
  const prices = {
    "SQFT": { usd: 100.00, sgd: 100.00 * SGD_PER_USD },
    "SRET": { usd: 250.00, sgd: 250.00 * SGD_PER_USD },
    "DEFAULT": { usd: 10.00, sgd: 10.00 * SGD_PER_USD }
  };

  return prices[symbol] || prices["DEFAULT"];
};

exports.formatCurrency = (amount, currency = 'USD') => {
  if (currency === 'SGD') {
    return `S$${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
};
