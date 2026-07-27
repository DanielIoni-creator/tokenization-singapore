const { ethers } = require('ethers');
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)','function symbol() view returns (string)','function name() view returns (string)'];

const getProvider = () => new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://eth.llamarpc.com');

const getTokenBalance = async (tokenAddress, walletAddress) => {
  const provider = getProvider();
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [balance, decimals, symbol, name] = await Promise.all([
    contract.balanceOf(walletAddress), contract.decimals(), contract.symbol(), contract.name(),
  ]);
  return { balance: ethers.formatUnits(balance, decimals), decimals, symbol, name, contractAddress: tokenAddress };
};

const getBalances = async (walletAddress, tokenAddresses) => {
  const results = await Promise.allSettled(tokenAddresses.map(addr => getTokenBalance(addr, walletAddress)));
  return results.map((r,i) => r.status === 'fulfilled' ? r.value : { error: r.reason?.message, contractAddress: tokenAddresses[i] });
};

module.exports = { getTokenBalance, getBalances, getProvider };
