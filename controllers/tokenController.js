'use strict';

const {
  getTokenBalances,
  isValidAddress
} = require('../utils/web3');
const { getTokenPrices } = require('../utils/priceService');

function formatCurrency(value, currency) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const locale = currency === 'SGD' ? 'en-SG' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function calculateValue(balance, price) {
  const numericBalance = Number(balance);
  const numericPrice = Number(price);

  if (!Number.isFinite(numericBalance) || !Number.isFinite(numericPrice)) {
    return null;
  }

  const value = numericBalance * numericPrice;
  return Number.isFinite(value) ? value : null;
}

async function getTokenBalance(req, res) {
  const walletAddress = req.params.walletAddress;

  if (!isValidAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Ethereum wallet address'
    });
  }

  try {
    const tokens = await getTokenBalances(walletAddress);
    const prices = await getTokenPrices(tokens);
    let totalUsd = 0;
    let totalSgd = 0;
    let hasUsdTotal = false;
    let hasSgdTotal = false;

    const result = tokens.map((token) => {
      const price = prices.get(token.contractAddress.toLowerCase()) || {};
      const valueUsd = calculateValue(token.balance, price.usd);
      const valueSgd = calculateValue(token.balance, price.sgd);

      if (valueUsd !== null) {
        totalUsd += valueUsd;
        hasUsdTotal = true;
      }

      if (valueSgd !== null) {
        totalSgd += valueSgd;
        hasSgdTotal = true;
      }

      return {
        contractAddress: token.contractAddress,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        rawBalance: token.rawBalance,
        balance: token.balance,
        price: {
          usd: price.usd ?? null,
          sgd: price.sgd ?? null
        },
        value: {
          usd: valueUsd,
          sgd: valueSgd
        },
        formatted: {
          balance: token.balance + ' ' + token.symbol,
          priceUsd: formatCurrency(price.usd, 'USD'),
          priceSgd: formatCurrency(price.sgd, 'SGD'),
          valueUsd: formatCurrency(valueUsd, 'USD'),
          valueSgd: formatCurrency(valueSgd, 'SGD')
        }
      };
    });

    return res.json({
      success: true,
      walletAddress,
      chain: process.env.DEFAULT_CHAIN || 'ethereum',
      tokens: result,
      totals: {
        usd: hasUsdTotal ? totalUsd : null,
        sgd: hasSgdTotal ? totalSgd : null,
        formatted: {
          usd: hasUsdTotal ? formatCurrency(totalUsd, 'USD') : null,
          sgd: hasSgdTotal ? formatCurrency(totalSgd, 'SGD') : null
        }
      }
    });
  } catch (error) {
    const statusCode =
      error.statusCode ||
      (error.code === 'CONFIGURATION_ERROR' ? 503 : 502);

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Unable to read token balances'
    });
  }
}

module.exports = {
  getTokenBalance
};
