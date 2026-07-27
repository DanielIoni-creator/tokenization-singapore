const priceService = require('../utils/priceService');
const web3Utils = require('../utils/web3');

// GET /api/tokens/balance/:walletAddress
exports.getWalletBalances = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address format.' });
    }

    const tokenBalances = await web3Utils.getWalletTokenBalances(walletAddress);

    let totalValueUSD = 0;
    let totalValueSGD = 0;

    const balances = await Promise.all(tokenBalances.map(async (token) => {
      const prices = await priceService.getTokenPrices(token.symbol);
      const valueUSD = token.balance * prices.usd;
      const valueSGD = token.balance * prices.sgd;

      totalValueUSD += valueUSD;
      totalValueSGD += valueSGD;

      return {
        symbol: token.symbol,
        name: token.name,
        contractAddress: token.contractAddress,
        balance: token.balance,
        priceUSD: prices.usd,
        priceSGD: prices.sgd,
        formattedPriceUSD: priceService.formatCurrency(prices.usd, 'USD'),
        formattedPriceSGD: priceService.formatCurrency(prices.sgd, 'SGD'),
        valueUSD: valueUSD,
        valueSGD: valueSGD,
        formattedValueUSD: priceService.formatCurrency(valueUSD, 'USD'),
        formattedValueSGD: priceService.formatCurrency(valueSGD, 'SGD')
      };
    }));

    res.json({
      success: true,
      walletAddress,
      totalValueUSD,
      totalValueSGD,
      formattedTotalValueUSD: priceService.formatCurrency(totalValueUSD, 'USD'),
      formattedTotalValueSGD: priceService.formatCurrency(totalValueSGD, 'SGD'),
      tokens: balances
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
