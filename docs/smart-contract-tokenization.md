# Smart Contract Tokenization

Issue #20 adds an on-chain contract layer for tokenized assets. The contract lives at:

```text
backend/contracts/AssetTokenization.sol
```

## Capabilities

- Fractional ownership: constructor mints a fixed ERC-20 compatible supply from `fractionCount`.
- Issuer reserve: `issuerReserveBps` allocates a retained portion to the deployer and the remaining supply to the sale treasury.
- Transfers: standard `transfer`, `approve`, and `transferFrom` functions are available.
- Regulated transfer controls: transfers start restricted and can be opened globally or allowlisted per account.
- Valuation metadata: owner can update asset valuation, currency, and metadata URI.
- Governance: token holders can create proposals, cast token-weighted votes, meet quorum, and emit a passed or failed execution result.

## Local Validation

From `backend`:

```bash
npm run validate:contracts
```

This compiles the Solidity source with `solc`, verifies there are no compiler errors, and checks that the ABI exposes the required tokenization, transfer, fractionalization, valuation, and governance functions.

## Deployment

From `backend`, configure:

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
