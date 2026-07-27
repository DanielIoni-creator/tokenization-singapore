// Web3 utility for querying token balances
const Token = require('../models/Token');

exports.getWalletTokenBalances = async (walletAddress) => {
  // Query active real estate tokens
  const tokens = await Token.find({ active: true });
  
  return tokens.map(token => ({
    tokenId: token._id,
    name: token.name,
    symbol: token.symbol,
    contractAddress: token.contractAddress || "0x0000000000000000000000000000000000000000",
    balance: Math.floor(Math.random() * 50) + 10 // Sample balance for demonstration
  }));
};
