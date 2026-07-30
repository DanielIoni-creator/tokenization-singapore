// utils/web3.js
const { ethers } = require('ethers');

// Minimal ERC-20 ABI for balanceOf and decimals
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

let provider = null;

function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

async function getTokenBalance(contractAddress, walletAddress) {
  const provider = getProvider();
  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

  const [rawBalance, decimals] = await Promise.all([
    contract.balanceOf(walletAddress),
    contract.decimals()
  ]);

  const formatted = ethers.formatUnits(rawBalance, decimals);

  return {
    raw: rawBalance.toString(),
    formatted,
    decimals: Number(decimals)
  };
}

function isValidAddress(address) {
  return ethers.isAddress(address);
}

module.exports = {
  getProvider,
  getTokenBalance,
  isValidAddress,
  ERC20_ABI
};