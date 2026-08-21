const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.join(__dirname, '..', 'contracts', 'AssetTokenization.sol');
const source = fs.readFileSync(contractPath, 'utf8');

assert.match(
  source,
  /require\(activeProposalCount == 0, "AssetTokenization: proposal already active"\)/,
  'governance should prevent concurrent proposals from indefinitely freezing transfers'
);

const input = {
  language: 'Solidity',
  sources: {
    'AssetTokenization.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors || []).filter((entry) => entry.severity === 'error');

assert.deepEqual(
  errors.map((entry) => entry.formattedMessage),
  [],
  'AssetTokenization.sol should compile without Solidity errors'
);

const contract = output.contracts['AssetTokenization.sol'].AssetTokenization;
assert.ok(contract.evm.bytecode.object.length > 0, 'compiled bytecode should not be empty');

const functionNames = new Set(
  contract.abi
    .filter((entry) => entry.type === 'function')
    .map((entry) => entry.name)
);

[
  'transfer',
  'approve',
  'transferFrom',
  'tokenPrice',
  'investorSupply',
  'setTransferAllowed',
  'setTransfersRestricted',
  'updateAssetValuation',
  'propose',
  'castVote',
  'executeProposal',
  'cancelProposal',
  'quorumVotes'
].forEach((name) => {
  assert.equal(functionNames.has(name), true, `ABI should expose ${name}`);
});

const eventNames = new Set(
  contract.abi
    .filter((entry) => entry.type === 'event')
    .map((entry) => entry.name)
);

[
  'Transfer',
  'Approval',
  'ProposalCreated',
  'VoteCast',
  'ProposalExecuted',
  'AssetValuationUpdated'
].forEach((name) => {
  assert.equal(eventNames.has(name), true, `ABI should expose ${name}`);
});

console.log('Asset tokenization smart contract validation passed');
