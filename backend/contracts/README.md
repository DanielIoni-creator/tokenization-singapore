# Asset tokenization smart contract

`AssetTokenization.sol` implements the issue #20 bounty scope:

- ERC-20 compatible fractional ownership units for a tokenized asset.
- Issuer reserve and investor-sale treasury allocation at deployment.
- Restricted transfers with an allowlist suitable for regulated real-estate offerings.
- Asset valuation, currency, and metadata URI management.
- Lightweight holder governance with proposal creation, token-weighted votes, quorum, and execution outcome events.

## Constructor

```solidity
constructor(
  string memory tokenName,
  string memory tokenSymbol,
  uint256 fractionCount,
  address saleTreasury,
  uint16 issuerReserveBps,
  uint256 initialAssetValuation,
  string memory initialCurrencyCode,
  string memory initialAssetUri,
  uint256 initialVotingPeriod,
  uint256 initialQuorumBps
)
```

`fractionCount` is expressed as whole fractional units. The contract scales this to ERC-20 decimals internally. For example, `10000` creates `10000 * 10^18` token units.

## Deployment

Set these environment variables from the `backend` directory:

```text
ETHEREUM_RPC_URL=
ETHEREUM_PRIVATE_KEY=
TOKEN_TREASURY_ADDRESS=
TOKEN_NAME=Singapore Real Estate Token
TOKEN_SYMBOL=SRET
TOKEN_FRACTIONS=10000
TOKEN_ISSUER_RESERVE_BPS=1000
TOKEN_ASSET_VALUATION=10000000
TOKEN_CURRENCY=SGD
TOKEN_ASSET_URI=ipfs://...
TOKEN_VOTING_PERIOD_SECONDS=604800
TOKEN_QUORUM_BPS=2000
```

Then run:

```bash
npm run deploy
```

The deployment script compiles the Solidity contract with `solc`, deploys through `ethers`, and prints the contract address and transaction hash.

## Validation

```bash
npm run validate:contracts
```

The validation script compiles the contract and checks that the ABI exposes transfer, fractionalization, valuation, transfer-control, and governance functions.
