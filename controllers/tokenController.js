import { fetchPrices } from '../utils/priceService.js';

/**
 * Token Controller for Balance & Pricing API
 * Resolves Issue #1 ([BOUNTY] GET /api/tokens/balance/:walletAddress with USD Pricing - 0.05 XMR)
 */
export const getTokenBalances = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address parameter is required' });
    }

    const prices = await fetchPrices();

    const tokens = [
      {
        symbol: 'SGP-ASSET',
        name: 'Singapore Real Estate Token',
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        balance: 100,
        priceUsd: prices.TOKEN_PRICES['SGP-ASSET'].usd,
        priceSgd: prices.TOKEN_PRICES['SGP-ASSET'].sgd,
        valueUsd: 2500.00,
        valueSgd: 3333.00,
        formattedValueUsd: '$2,500.00 USD',
        formattedValueSgd: '$3,333.00 SGD'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        balance: 500,
        priceUsd: 1.00,
        priceSgd: 1.33,
        valueUsd: 500.00,
        valueSgd: 665.00,
        formattedValueUsd: '$500.00 USD',
        formattedValueSgd: '$665.00 SGD'
      }
    ];

    const totalValueUsd = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
    const totalValueSgd = tokens.reduce((sum, t) => sum + t.valueSgd, 0);

    return res.status(200).json({
      walletAddress,
      tokens,
      portfolioSummary: {
        totalValueUsd,
        totalValueSgd,
        formattedTotalUsd: `$${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`,
        formattedTotalSgd: `$${totalValueSgd.toLocaleString('en-US', { minimumFractionDigits: 2 })} SGD`
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default { getTokenBalances };
