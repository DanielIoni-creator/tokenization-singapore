# Tokenization System Documentation

Comprehensive documentation for the Singapore real-estate tokenization platform, covering smart contract, backend API, and mobile integration.

**Issue:** #23 — Documentazione per la Tokenizzazione

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Developer Guide — Smart Contract](#2-developer-guide--smart-contract)
3. [Developer Guide — Backend API](#3-developer-guide--backend-api)
4. [Developer Guide — WebSocket](#4-developer-guide--websocket)
5. [User Guide — How to Tokenize Assets](#5-user-guide--how-to-tokenize-assets)
6. [Usage Examples](#6-usage-examples)
7. [Environment Configuration](#7-environment-configuration)

---

## 1. Architecture Overview

```
                   +-------------------+
                   |   Mobile Client   |
  (React Native)   |  api.js / axios   |
                   +---------+---------+
                             |
                    REST / WebSocket
                             |
              +--------------+--------------+
              |       Express server         |
              |   (backend/server.js)       |
              +----+------+-------+---------+
                   |      |       |
              +----+   +--+--+   +-------+
              |Auth | |Tokens| |Messages|
              |     | |      | |  +WS    |
              +-----+ +------+ +--------+
                   |
              +----+----+
              | MongoDB |
              +---------+
                   |
              +----+----+
              |Contract |
              | (Solidity)|
              +---------+
```

**Components:**

- **Smart Contract** (`AssetTokenization.sol`): ERC-20 compatible fractional-ownership token with governance, deployed on EVM-compatible chains
- **Backend API** (Express + MongoDB): REST endpoints for authentication, tokenization, ACRA verification, orders, and P2P messaging
- **WebSocket Server** (Socket.IO): real-time messaging with JWT authentication
- **Mobile Client** (React Native): consumer-facing app with Redux state management

---

## 2. Developer Guide — Smart Contract

### 2.1 Contract Overview

`AssetTokenization.sol` is a Solidity 0.8.20 ERC-20 compatible contract that represents fractional ownership of a real-estate asset.

**Key properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Token name |
| `symbol` | string | Token symbol |
| `totalSupply` | uint256 (immutable) | Total token supply = `fractionCount * 10^18` |
| `issuerReserve` | uint256 (immutable) | Reserve held by deployer |
| `owner` | address | Contract admin |
| `treasury` | address | Sale treasury address |
| `assetValuation` | uint256 | Current asset valuation |
| `transfersRestricted` | bool | Global transfer restriction flag (default true) |

### 2.2 Constructor Parameters

```solidity
constructor(
    string memory tokenName,        // e.g. "Singapore Real Estate Token"
    string memory tokenSymbol,      // e.g. "SRET"
    uint256 fractionCount,          // e.g. 10000
    address saleTreasury,           // treasury address for investor tokens
    uint16 issuerReserveBps,        // issuer reserve in basis points (0-10000)
    uint256 initialAssetValuation,  // e.g. 10000000
    string memory initialCurrencyCode, // e.g. "SGD"
    string memory initialAssetUri,  // metadata URI
    uint256 initialVotingPeriod,    // in seconds (minimum 1 hour)
    uint256 initialQuorumBps        // quorum in basis points (0-10000)
)
```

**Token distribution on deployment:**
- `issuerReserve = (totalSupply * issuerReserveBps) / 10000`
- Deployer receives `issuerReserve` tokens
- Treasury receives `totalSupply - issuerReserve` tokens

### 2.3 Core Functions

#### Token Transfers

| Function | Signature | Notes |
|----------|-----------|-------|
| `transfer` | `(address to, uint256 value) -> bool` | Standard ERC-20 transfer |
| `approve` | `(address spender, uint256 value) -> bool` | Sets spender allowance |
| `transferFrom` | `(address from, address to, uint256 value) -> bool` | Requires prior approval |

**Transfer restrictions:** When `transfersRestricted` is true, either the `from` or `to` address must be in the `transferAllowed` mapping. The owner controls this via `setTransferAllowed(address account, bool allowed)` and `setTransfersRestricted(bool)`.

**During active governance proposals**, all transfers are blocked (`require(activeProposalCount == 0)`).

#### Token Information

| Function | Description |
|----------|-------------|
| `tokenPrice()` | Returns `assetValuation / totalFractions` |
| `investorSupply()` | Returns `totalSupply - issuerReserve` |
| `quorumVotes()` | Returns `(totalSupply * quorumBps) / 10000` |
| `balanceOf(address)` | Returns token balance |
| `allowance(address owner, address spender)` | Returns allowance |

#### Governance

| Function | Signature | Required Role | Description |
|----------|-----------|---------------|-------------|
| `propose` | `(string description, bytes32 executionDataHash) -> uint256 proposalId` | Token holder (balance > 0) | Create a proposal with a voting period of `votingPeriod` seconds |
| `castVote` | `(uint256 proposalId, bool support)` | Token holder (balance > 0) | Vote for or against a proposal; weight = caller's balance |
| `executeProposal` | `(uint256 proposalId) -> bool passed` | Anyone | Execute after voting ends; passes if `forVotes > againstVotes` and total votes >= quorum |
| `cancelProposal` | `(uint256 proposalId)` | Owner or proposer | Cancel a pending proposal |

#### Admin Functions (owner only)

| Function | Description |
|----------|-------------|
| `setTransferAllowed(address, bool)` | Allow/deny specific address transfers |
| `setTransfersRestricted(bool)` | Toggle global transfer restriction |
| `updateTreasury(address)` | Change treasury address |
| `updateAssetValuation(uint256, string)` | Update valuation and currency |
| `updateAssetUri(string)` | Update metadata URI |
| `updateGovernanceSettings(uint256, uint256)` | Update voting period and quorum |
| `transferOwnership(address)` | Transfer contract ownership |

### 2.4 Events

The contract emits standard ERC-20 events plus governance events:

``+Transfer, Approval, OwnershipTransferred, TreasuryUpdated,
TransferPolicyUpdated, TransferAllowedUpdated, AssetValuationUpdated,
AssetUriUpdated, ProposalCreated, VoteCast, ProposalExecuted, ProposalCanceled``

### 2.5 Compilation and Validation

From `backend/contracts/`:

```bash
# Compile and validate the contract
node scripts/validateSmartContract.js

# Deploy (requires environment configuration)
# See Environment Configuration section
npm run deploy
```

The `validateSmartContract.js` script verifies:
- The contract compiles without Solidity errors
- Bytecode is non-empty
- The ABI exposes all required function names
- The ABI exposes all required event names

---

## 3. Developer Guide — Backend API

### 3.1 Base URL

```
http://localhost:3000/api    (development)
https://api.example.com/api   (production)
```

All endpoints return JSON with `{ success, data, message }` or `{ success, errors, message }` structure.

### 3.2 Authentication

Authentication uses JWT bearer tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default 7 days). The JWT payload contains `{ id, email, role }`.

### 3.3 API Endpoints

#### Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Create a new user account |
| POST | `/api/auth/login` | None | Authenticate and receive JWT |
| GET | `/api/auth/profile` | Bearer | Get current user profile |
| PUT | `/api/auth/profile` | Bearer | Update profile fields |
| POST | `/api/auth/logout` | Bearer | Client-side logout (stateless JWT) |
| PUT | `/api/auth/language` | Bearer | Change preferred language |

**Register:**
```json
Request:
POST /api/auth/register
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "securepassword",
  "fullName": "Alice Lee"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": { "user": { ... }, "token": "eyJhbGc..." }
}
```

**Login:**
```json
Request:
POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": { "user": { ... }, "token": "eyJhbGc..." }
}
```

**User Roles:**
- `user`: default role
- `investor`: can invest in tokens
- `seller`: can list assets
- `admin`: administrative access
- `superadmin`: highest access level

#### Tokenization (`/api/tokens`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tokens` | Bearer | List all tokens |
| GET | `/api/tokens/:id` | Bearer | Get a specific token |
| POST | `/api/tokens/preview-fractionalization` | Bearer | Preview tokenization math |
| POST | `/api/tokens/real-estate` | Bearer | Create a real-estate tokenization |
| POST | `/api/tokens/:id/verify-registry` | Bearer | Verify Singapore land registry evidence |

**Create Real Estate Tokenization:**
```json
Request:
POST /api/tokens/real-estate
Authorization: Bearer <token>
{
  "name": "Orchard Tower A",
  "symbol": "OTA",
  "totalSupply": 10000,
  "status": "draft",
  "propertyDetails": {
    "address": {
      "street": "1 Orchard Road",
      "postalCode": "238873",
      "city": "Singapore",
      "country": "Singapore"
    },
    "propertyType": "commercial",
    "valuation": 5000000,
    "valuationCurrency": "SGD"
  },
  "registry": {
    "authority": "SLA_INLIS",
    "titleNumber": "T12345"
  },
  "fractionalization": {
    "totalShares": 10000,
    "tokenDecimals": 18,
    "currency": "SGD",
    "issuerReservePercent": 10,
    "minimumInvestment": 1000
  },
  "compliance": {
    "jurisdiction": "Singapore",
    "offeringType": "private-placement",
    "requiresAccreditedInvestor": true
  }
}

Response:
{
  "success": true,
  "message": "Token created successfully",
  "data": { "_id": "...", "name": "Orchard Tower A", ... },
  "tokenization": {
    "totalShares": 10000,
    "tokenPrice": 500,
    "ownershipPerTokenPercent": 0.01,
    "investorAvailableTokens": 9000,
    "investorAvailableRaise": 4500000,
    "minimumTokens": 2,
    "distributionStatus": "modeling"
  }
}
```

**Validation:** All tokenization endpoints use Joi schemas with `stripUnknown: true` to prevent unexpected fields. A valid Singapore postal code is 6 digits (`^\d{6}$`). Registry fingerprints must be 64 hex characters.

#### ACRA Legal Identity (`/api/acra`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/acra/lookup` | Bearer | Look up a Singapore entity by UEN |
| POST | `/api/acra/tokens/:id/verify-spv` | Bearer | Verify a token's SPV entity against ACRA |
| POST | `/api/acra/verify-entity` | Bearer | Verify and attach legal identity to current user |

**Verify Entity (User):**
```json
Request:
POST /api/acra/verify-entity
Authorization: Bearer <token>
{
  "uen": "202100001A",
  "entityName": "My Company Pte Ltd",
  "record": { }
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "verification": {
      "verificationStatus": "verified",
      "entity": { "uen": "202100001A", "entityName": "My Company Pte Ltd", ... }
    }
  }
}
```

#### Orders (`/api/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/orders` | Bearer | Get current user's orders |
| GET | `/api/orders/:id` | Bearer | Get a specific order |

Orders support payment methods: `monero`, `ethereum`, `bank-transfer`. Payment status: `pending`, `processing`, `completed`, `failed`, `refunded`.

#### Messages (`/api/messages`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/messages/conversations` | Bearer | List all conversations |
| GET | `/api/messages/conversation/:userId?limit=50&before=ISO_DATE` | Bearer | Get messages with another user |
| POST | `/api/messages/send` | Bearer | Send a message |
| PUT | `/api/messages/read` | Bearer | Mark messages as read |
| GET | `/api/messages/unread` | Bearer | Get unread count |

**Send Message:**
```json
Request:
POST /api/messages/send
Authorization: Bearer <token>
{
  "recipientId": "60f1234567890abcdef12345",
  "content": "Hello, interested in your token",
  "type": "text"
}

Response:
{
  "success": true,
  "data": {
    "sender": { "username": "alice", "fullName": "Alice Lee" },
    "recipient": { "username": "bob", "fullName": "Bob Tan" },
    "content": "Hello, interested in your token",
    "type": "text",
    "status": "sent",
    "createdAt": "2026-07-31T..."
  }
}
```

#### Admin (`/api/admin`)

Requires admin or superadmin role. Uses the `isAdmin` and `isSuperAdmin` middleware from `backend/middleware/auth.js`.

#### Monero (`/api/monero`)

Provides wallet status, balance, address, subaddress generation, transaction history, and payment verification endpoints.

### 3.4 Response Format

All API responses follow a consistent structure:

```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Error
{ "success": false, "message": "Error description" }

// Validation error
{ "success": false, "message": "Validation failed", "errors": ["field error details"] }
```

### 3.5 Authentication Middleware

The backend uses `backend/middleware/auth.js` which exports:

- `authenticate`: Verifies JWT, loads user from DB, checks `isActive`, attaches `req.user`
- `isAdmin`: Requires `role === 'admin'` or `role === 'superadmin'`
- `isSuperAdmin`: Requires `role === 'superadmin'`
- `isAccredited`: Requires `isAccredited === true`

### 3.6 Internationalization (i18n)

The backend supports four languages: `en`, `zh`, `ms`, `ta`. Language is determined in order:
1. User's saved `language` field
2. `Accept-Language` header
3. `?lang=` query parameter

Translation keys use dot notation: `auth.login.success`, `tokens.create.symbol_exists`, etc.

---

## 4. Developer Guide — WebSocket

### 4.1 Connection

The WebSocket server uses Socket.IO and runs on the same port as the HTTP server.

```
ws://localhost:3000      (development)
wss://api.example.com    (production)
```

### 4.2 Authentication

Clients authenticate during the handshake:

```js
const socket = io("ws://localhost:3000", {
  auth: { token: "eyJhbGc..." }
});
```

The server verifies the JWT. If the token is invalid, the connection is rejected.

### 4.3 Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client -> Server | `send-message` | `{ recipientId, content, orderId, attachments }` | Send a message |
| Client -> Server | `typing` | `{ recipientId }` | Typing indicator |
| Client -> Server | `mark-read` | `{ senderId }` | Mark messages as read |
| Server -> Client | `new-message` | `Message` object | New message received |
| Server -> Client | `message-sent` | `Message` object | Message send confirmation |
| Server -> Client | `user-typing` | `{ senderId }` | Typing indicator |
| Server -> Client | `messages-read` | `{ readBy }` | Messages marked as read |
| Server -> Client | `error` | `{ message }` | Error event |

### 4.4 Rooms

Each user is automatically joined to a room named after their user ID (`socket.join(userId)`). Messages are emitted to the recipient's room.

---

## 5. User Guide — How to Tokenize Assets

### 5.1 Register an Account

1. Open the mobile app or use the API
2. Provide a username, email, and password (minimum 8 characters)
3. Verify your email (if verification is enabled)
4. Log in to receive your JWT token

### 5.2 Verify Your Legal Identity (ACRA)

For institutional tokenization (SPV-backed):

1. Look up your Singapore entity by UEN
2. Submit the entity for ACRA verification
3. Once verified, your `legalIdentity` will include the entity name, status, and verification fingerprint

### 5.3 Create a Tokenization Proposal

1. Provide the property address (Singapore postal code must be 6 digits)
2. Set the property type (residential, commercial, mixed, industrial)
3. Enter the valuation and currency (default SGD)
4. Configure fractionalization (total shares, decimals, issuer reserve)
5. Add registry evidence (title number, lot number, or strata lot number)
6. Set compliance requirements (offering type, accredited investor requirement)
7. Preview the fractionalization math to confirm the pricing
8. Submit the tokenization — a `Token` document is created in the database

### 5.4 Verify Registry Evidence

1. Generate a registry fingerprint (SHA-256 hash of the evidence)
2. Submit the fingerprint via the verify-registry endpoint
3. The system compares the submitted fingerprint with the stored evidence
4. Verification status updates to `verified`, `rejected`, or `expired`

### 5.5 Manage Tokens

Once a token is active:
- Investors can view the token details and prices
- The admin can update the asset valuation
- Token holders interact with the smart contract for transfers and governance
- The admin can pause or close the offering

### 5.6 Voting on Proposals

If the smart contract has been deployed:
1. A token holder calls `propose()` with a description and a hash of the intended execution data
2. Other holders `castVote()` during the voting period (weight = their balance)
3. After the voting period, anyone calls `executeProposal()`
4. The proposal passes if `forVotes > againstVotes` AND total votes >= quorum

---

## 6. Usage Examples

### 6.1 Register and Get Token

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"mypassword123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"mypassword123"}'
```

### 6.2 Create a Tokenization

```bash
TOKEN="eyJhbGc..."

curl -X POST http://localhost:3000/api/tokens/real-estate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Marina Bay Office",
    "symbol": "MBO",
    "totalSupply": 50000,
    "status": "draft",
    "propertyDetails": {
      "address": {
        "street": "10 Marina Boulevard",
        "postalCode": "018981",
        "city": "Singapore",
        "country": "Singapore"
      },
      "propertyType": "commercial",
      "valuation": 10000000,
      "valuationCurrency": "SGD"
    },
    "registry": {
      "authority": "SLA_INLIS",
      "titleNumber": "MBO-2024-001"
    },
    "fractionalization": {
      "totalShares": 50000,
      "tokenDecimals": 18,
      "currency": "SGD",
      "issuerReservePercent": 15
    },
    "compliance": {
      "jurisdiction": "Singapore",
      "offeringType": "private-placement",
      "requiresAccreditedInvestor": true
    }
  }'
```

### 6.3 Verify a Registry Fingerprint

```bash
TOKEN_ID="60f1234567890abcdef12345"
FINGERPRINT="a1b2c3d4e5..."  # 64 hex chars (SHA-256)

curl -X POST "http://localhost:3000/api/tokens/$TOKEN_ID/verify-registry" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"registryFingerprint\":\"$FINGERPRINT\"}"
```

### 6.4 ACRA Entity Lookup

```bash
curl -X POST http://localhost:3000/api/acra/lookup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"uen":"202100001A","entityName":"Example Pte Ltd"}'
```

### 6.5 WebSocket Messaging

```javascript
import { io } from "socket.io-client";

const socket = io("ws://localhost:3000", {
  auth: { token: "eyJhbGc..." }
});

// Listen for messages
socket.on("new-message", (msg) => {
  console.log("New message:", msg.content);
});

// Send a message
socket.emit("send-message", {
  recipientId: "60f1234567890abcdef12345",
  content: "Is this property still available?",
  type: "text"
});

// Typing indicator
socket.emit("typing", {
  recipientId: "60f1234567890abcdef12345"
});

// Mark messages as read
socket.emit("mark-read", {
  senderId: "60f1234567890abcdef12345"
});

socket.on("message-sent", (msg) => console.log("Sent:", msg._id));
socket.on("messages-read", ({ readBy }) => console.log("Read by:", readBy));
```

### 6.6 Smart Contract Interaction (ethers.js)

```javascript
import { ethers } from "ethers";

// ABI (abbreviated)
const abi = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function propose(string description, bytes32 executionDataHash) returns (uint256)",
  "function castVote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId) returns (bool)",
  "function tokenPrice() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

// Check token price
const price = await contract.tokenPrice();
console.log("Price:", ethers.formatUnits(price, 18));

// Transfer tokens
const tx = await contract.transfer(recipientAddress, ethers.parseUnits("100", 18));
await tx.wait();

// Create a governance proposal
const proposalId = await contract.propose(
  "Update treasury address",
  ethers.id("setTreasury(newAddress)")
);

// Cast a vote
await contract.castVote(proposalId, true); // true = for, false = against

// Execute the proposal after voting period
const passed = await contract.executeProposal(proposalId);
console.log("Proposal passed:", passed);
```

### 6.7 Mobile API Client

```javascript
// React Native authentication
import { login } from "./store/authSlice";
import { useDispatch } from "react-redux";

const dispatch = useDispatch();

// Login
dispatch(login({ email: "alice@example.com", password: "mypassword123" }))
  .unwrap()
  .then(({ user, token }) => {
    console.log("Logged in as", user.username);
  });

// The token is automatically attached to all subsequent API calls
// via the axios request interceptor in api.js
```

---

## 7. Environment Configuration

The backend uses `dotenv` to load configuration from `backend/.env`. The following variables are required:

| Variable | Description | Example |
----------|-----------|---------|
| `JWT_SECRET` | JWT signing secret (use a strong, random value) | `your-secret-here` |
| `JWT_EXPIRES_IN` | Token expiry time | `7d` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/tokenization-singapore` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://app.example.com` |

**Smart contract deployment variables:**

| Variable | Description |
----------|-------------|
| `ETHEREUM_RPC_URL` | Ethereum JSON-RPC endpoint |
| `ETHEREUM_PRIVATE_KEY` | Deployer wallet private key |
| `TOKEN_TREASURY_ADDRESS` | Treasury address for investor tokens |
| `TOKEN_NAME` | Token name |
| `TOKEN_SYMBOL` | Token symbol |
| `TOKEN_FRACTIONS` | Total fraction count |
| `TOKEN_ISSUER_RESERVE_BPS` | Reserve in basis points |
| `TOKEN_ASSET_VALUATION` | Asset valuation |
| `TOKEN_CURRENCY` | Currency code |
| `TOKEN_ASSET_URI` | Metadata URI |
| `TOKEN_VOTING_PERIOD_SECONDS` | Voting period |
| `TOKEN_QUORUM_BPS` | Quorum in basis points |

**Mobile environment (React Native @env):**

| Variable | Description |
----------|-------------|
| `API_URL` | Backend API base URL |
| `WS_URL` | WebSocket URL |
| `ENABLE_BIOMETRIC` | Enable biometric auth |
| `ENABLE_PUSH_NOTIFICATIONS` | Enable FCM/push |
| `ENABLE_OFFLINE_MODE` | Enable offline caching |

---

*Developed with AI assistance and disclosed transparently.*
