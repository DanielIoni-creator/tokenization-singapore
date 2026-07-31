const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function compileContract() {
  const contractPath = path.join(__dirname, '..', 'AssetTokenization.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'AssetTokenization.sol': {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((entry) => entry.severity === 'error');
  if (errors.length > 0) {
    throw new Error(errors.map((entry) => entry.formattedMessage).join('\n'));
  }

  return output.contracts['AssetTokenization.sol'].AssetTokenization;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function deploymentArguments() {
  return [
    process.env.TOKEN_NAME || 'Singapore Real Estate Token',
    process.env.TOKEN_SYMBOL || 'SRET',
    BigInt(process.env.TOKEN_FRACTIONS || '10000'),
    requiredEnv('TOKEN_TREASURY_ADDRESS'),
    Number(process.env.TOKEN_ISSUER_RESERVE_BPS || '1000'),
    BigInt(process.env.TOKEN_ASSET_VALUATION || '10000000'),
    process.env.TOKEN_CURRENCY || 'SGD',
    process.env.TOKEN_ASSET_URI || 'ipfs://pending-property-metadata',
    BigInt(process.env.TOKEN_VOTING_PERIOD_SECONDS || '604800'),
    Number(process.env.TOKEN_QUORUM_BPS || '2000')
  ];
}

async function main() {
  const compiled = compileContract();
  const provider = new ethers.JsonRpcProvider(requiredEnv('ETHEREUM_RPC_URL'));
  const wallet = new ethers.Wallet(requiredEnv('ETHEREUM_PRIVATE_KEY'), provider);
  const factory = new ethers.ContractFactory(compiled.abi, compiled.evm.bytecode.object, wallet);
  const contract = await factory.deploy(...deploymentArguments());

  console.log(`Deploying AssetTokenization from ${wallet.address}`);
  console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();

  console.log(`AssetTokenization deployed at ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
