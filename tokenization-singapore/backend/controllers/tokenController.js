// controllers/tokenController.js
const Token = require('../models/Token');
const { getTokenBalance, isValidAddress } = require('../utils/web3');
const { getTokenPrice, formatCurrency } = require('../utils/priceService');

exports.getAllTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

exports.getTokenById = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: req.t ? req.t('tokens.deploy.not_found') : 'Token not found'
      });
    }
    res.json({
      success: true,
      data: token
    });
  } catch (error) {
    next(error);
  }
};

exports.getWalletBalance = async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    // Validate wallet address format
    if (!walletAddress || !isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum wallet address'
      });
    }

    // Fetch all tokens from the database
    const tokens = await Token.find({
      status: 'active',
      contractAddress: { $ne: null, $ne: '' }
    });

    if (tokens.length === 0) {
      return res.json({
        success: true,
        walletAddress,
        balances: [],
        message: 'No active tokens found on the platform'
      });
    }

    // For each token, fetch on-chain balance and price
    const balances = await Promise.all(
      tokens.map(async (token) => {
        try {
          const [balance, price] = await Promise.all([
            getTokenBalance(token.contractAddress, walletAddress),
            getTokenPrice(token.symbol)
          ]);

          const balanceNum = parseFloat(balance.formatted);
          const valueUSD = balanceNum * price.usd;
          const valueSGD = balanceNum * price.sgd;

          return {
            token: {
              id: token._id,
              name: token.name,
              symbol: token.symbol,
              contractAddress: token.contractAddress,
              type: token.type,
              tokenPrice: token.tokenPrice
            },
            balance: {
              raw: balance.raw,
              formatted: balance.formatted,
              decimals: balance.decimals
            },
            price: {
              usd: price.usd,
              sgd: price.sgd,
              usdFormatted: formatCurrency(price.usd, 'USD'),
              sgdFormatted: formatCurrency(price.sgd, 'SGD')
            },
            value: {
              usd: valueUSD,
              sgd: valueSGD,
              usdFormatted: formatCurrency(valueUSD, 'USD'),
              sgdFormatted: formatCurrency(valueSGD, 'SGD')
            }
          };
        } catch (err) {
          // If a single token balance fetch fails (e.g., invalid contract),
          // include it with zero balance instead of failing the whole request
          return {
            token: {
              id: token._id,
              name: token.name,
              symbol: token.symbol,
              contractAddress: token.contractAddress,
              type: token.type,
              tokenPrice: token.tokenPrice
            },
            balance: {
              raw: '0',
              formatted: '0.0',
              decimals: 18
            },
            price: {
              usd: 0,
              sgd: 0,
              usdFormatted: formatCurrency(0, 'USD'),
              sgdFormatted: formatCurrency(0, 'SGD')
            },
            value: {
              usd: 0,
              sgd: 0,
              usdFormatted: formatCurrency(0, 'USD'),
              sgdFormatted: formatCurrency(0, 'SGD')
            },
            error: err.message
          };
        }
      })
    );

    // Calculate totals
    const totals = {
      totalValueUSD: balances.reduce((sum, b) => sum + b.value.usd, 0),
      totalValueSGD: balances.reduce((sum, b) => sum + b.value.sgd, 0),
      usdFormatted: '',
      sgdFormatted: ''
    };
    totals.usdFormatted = formatCurrency(totals.totalValueUSD, 'USD');
    totals.sgdFormatted = formatCurrency(totals.totalValueSGD, 'SGD');

    res.json({
      success: true,
      walletAddress,
      totals,
      count: balances.length,
      balances
    });
  } catch (error) {
    next(error);
  }
};