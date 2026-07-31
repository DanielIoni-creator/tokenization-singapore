# Security Audit Report — tokenization-singapore

**Repository:** `DanielIoni-creator/tokenization-singapore`
**Audit scope:** Smart contract (`AssetTokenization.sol`), backend API (Express/Node.js), WebSocket messaging, mobile client (React Native)
**Method:** Manual static analysis of source code from repository head (PR #29 base)
**Date:** 2026-07-31
**Auditor:** SourceProofLabs (AI-assisted, disclosed)

---

## Executive Summary

The audit identified **2 Critical**, **6 High**, **9 Medium**, and **6 Low/Informational** findings across the smart contract, backend API, WebSocket layer, and mobile client.

The two most severe issues are hardcoded production secrets committed to the repository (`backend/.env`) and a hardcoded JWT fallback secret (`'supersecretkey'`) in the WebSocket server and messaging routes that allows token forgery when the `JWT_SECRET` environment variable is absent. Together these enable full authentication bypass.

On the smart contract side, the governance mechanism lacks a minimum proposal threshold, allowing a single-token holder to create unlimited proposals that block all token transfers while active (griefing). The `owner` role has unilateral control over asset valuation, transfer policy, and treasury — a centralization risk with no timelock or multisig.

| ID | Severity | Title |
|----|----------|-------|
| C-1 | Critical | Hardcoded secrets committed in `backend/.env` |
| C-2 | Critical | Hardcoded JWT fallback secret enables token forgery |
| H-1 | High | Mass assignment in `updateProfile` allows privilege escalation |
| H-2 | High | Password change without current-password verification |
| H-3 | High | No rate limiting on authentication endpoints |
| H-4 | High | CORS allows all origins (Express + WebSocket) |
| H-5 | High | Error responses leak internal details |
| H-6 | High | PII disclosure via conversation endpoint |
| M-1 | Medium | Governance griefing: no proposal threshold blocks all transfers |
| M-2 | Medium | Smart contract centralization: no timelock/multisig |
| M-3 | Medium | Missing event emission for `updateGovernanceSettings` |
| M-4 | Medium | `unchecked` arithmetic blocks reduce defense-in-depth |
| M-5 | Medium | No zero-address check on `from` in `_transfer` |
| M-6 | Medium | Inconsistent/duplicate JWT middleware |
| M-7 | Medium | WebSocket event inputs not validated |
| M-8 | Medium | Mobile JWT stored in Redux (potential insecure persistence) |
| M-9 | Medium | ERC-20 approve race condition |
| L-1 | Low | No email verification on registration |
| L-2 | Low | Token price integer division truncation |
| L-3 | Low | Root `server.js` missing security middleware |
| L-4 | Low | No token revocation/blacklist mechanism |
| L-5 | Low | API defaults to HTTP in mobile config |
| L-6 | Informational | No certificate pinning on mobile API client |

---

## Critical Findings

### C-1: Hardcoded secrets committed in `backend/.env`

**Location:** `backend/.env`
**Severity:** Critical

**Description:** The repository contains a `.env` file with hardcoded secrets committed to version control. This file includes:
- JWT signing secret (placeholder default, not rotated)
- Ethereum private key (placeholder default, not rotated)
- Admin password
- Telegram bot token
- Internal bot API key
- Monero wallet address
- CORS origin set to wildcard (`*`)

**Impact:** Anyone with read access to the repository obtains all secrets needed to forge JWT tokens, access the admin account, control the Telegram bot, and potentially interact with the associated Ethereum wallet. If the placeholder values are replaced with real secrets in a deployed instance and the `.env` is not gitignored, a full breach is possible.

**Recommendation:**
- Add `.env` to `.gitignore` immediately and remove from repository history (use BFG or `git-filter-repo`).
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) or environment-variable injection at deploy time.
- Rotate all exposed credentials.
- Ensure `.env.example` documents required variables without containing live values.

---

### C-2: Hardcoded JWT fallback secret enables token forgery

**Location:** `websocket/server.js` (line ~30), `routes/messages.js` (line ~8)
**Severity:** Critical

**Description:** Both the WebSocket server and the messaging route define inline JWT verification with a hardcoded fallback:

```js
jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', ...)
```

If the `JWT_SECRET` environment variable is unset or empty (e.g., a misconfigured deployment, a fresh clone running locally, or env var loading failure), the system silently falls back to the publicly known string `'supersecretkey'`. Any attacker can then craft valid JWT tokens for any user ID and role, achieving full authentication bypass.

Additionally, `routes/messages.js` defines a **duplicate** JWT middleware (`authenticateJWT`) separate from `backend/middleware/auth.js`, creating two divergent authentication code paths.

**Impact:** Complete authentication bypass leading to unauthorized data access, message spoofing, and admin impersonation.

**Recommendation:**
- Remove the `|| 'supersecretkey'` fallback entirely. Fail explicitly if `JWT_SECRET` is missing.
- Consolidate to a single JWT verification middleware (`backend/middleware/auth.js`) imported across all routes.
- Use a long, cryptographically random secret (256-bit minimum) stored exclusively in environment variables or a secrets manager.
- Add startup validation: if `JWT_SECRET` is missing or shorter than 32 chars, refuse to start.

---

## High Findings

### H-1: Mass assignment in `updateProfile` allows privilege escalation

**Location:** `backend/controllers/authController.js`, `updateProfile` function
**Severity:** High

**Description:** The `updateProfile` controller accepts an arbitrary `req.body` object, deletes a few fields (`_id`, `email`, `username`, `role`, `createdAt`), then passes the remainder directly to `User.findByIdAndUpdate`:

```js
const updates = req.body;
delete updates._id;
delete updates.email;
delete updates.username;
delete updates.role;
delete updates.createdAt;
// ...
const user = await User.findByIdAndUpdate(userId, { ...updates, updatedAt: new Date() }, { new: true, runValidators: true });
```

Critical fields NOT deleted include: `isAccredited`, `isVerified`, `verificationToken`, `verificationExpires`, `isActive`, `lastLogin`, `language`, `stats`, `accreditationDocuments`, `legalIdentity`, `ethereumAddress`, `moneroAddress`.

**Impact:** Any authenticated user can POST `{"isAccredited": true, "isVerified": true}` to grant themselves accredited-investor status and verified identity, bypassing the accreditation and ACRA verification workflows. They can also set `verificationToken` and `verificationExpires` to arbitrary values.

**Recommendation:**
- Use an explicit allowlist of updatable fields: `{ fullName, phone, country, city, bio, password }`.
- Never accept `isAccredited`, `isVerified`, `verificationToken`, `verificationExpires`, `isActive`, `role`, `legalIdentity`, `accreditationDocuments`, or `stats` via the profile update endpoint.
- Validate all input with Joi schemas (as done in `tokenController.js`).

---

### H-2: Password change without current-password verification

**Location:** `backend/controllers/authController.js`, `updateProfile` function
**Severity:** High

**Description:** When `updates.password` is present, the profile update endpoint hashes and saves the new password without requiring the user to provide their current password:

```js
if (updates.password) {
  const salt = await bcrypt.genSalt(12);
  updates.password = await bcrypt.hash(updates.password, salt);
}
```

**Impact:** If an attacker obtains a valid JWT (e.g., via XSS, leaked token, or C-2 token forgery), they can silently change the victim's password without knowing the current one, maintaining persistent access.

**Recommendation:**
- Require `currentPassword` field when changing password.
- Verify `currentPassword` via `user.comparePassword()` before allowing the update.
- Consider a separate `/auth/change-password` endpoint with its own rate limiting.

---

### H-3: No rate limiting on authentication endpoints

**Location:** `backend/server.js` (no rate-limit middleware registered), `backend/controllers/authController.js`
**Severity:** High

**Description:** The Express server does not configure any rate-limiting middleware (e.g., `express-rate-limit`). Login and registration endpoints are unbounded, allowing brute-force password attacks and registration flooding.

**Impact:** Attackers can perform unlimited login attempts to brute-force user passwords. Registration flooding can enumerate existing emails/usernames (the 409 responses distinguish email-exists from username-exists).

**Recommendation:**
- Install and configure `express-rate-limit`:
  - Login: max 5 attempts per 15 minutes per IP.
  - Register: max 3 attempts per hour per IP.
- Consider progressive backoff or temporary account lockout after repeated failures.
- Add a generic "Invalid credentials" message for all login failures (already done — good).

---

### H-4: CORS allows all origins

**Location:** `backend/server.js` (`app.use(cors())`), `websocket/server.js` (`cors: { origin: "*" }`), root `server.js` (`app.use(cors())`)
**Severity:** High

**Description:** All three server entry points use the `cors()` middleware with default options or explicit `origin: "*"`, allowing cross-origin requests from any domain. The `.env` file also sets `CORS_ORIGIN=*`.

**Impact:** Malicious websites can make authenticated cross-origin requests to the API if a user has an active session or if the JWT is accessible via JavaScript. Bearer tokens in the Authorization header are sent on every cross-origin request when CORS allows it.

**Recommendation:**
- Configure CORS with an explicit allowlist:
```js
app.use(cors({ origin: ["https://app.example.com", "https://staging.example.com"], credentials: false }));
```
- Apply the same origin restriction to the Socket.IO server.
- Remove the `CORS_ORIGIN=*` default from `.env.example`.

---

### H-5: Error responses leak internal details

**Location:** `backend/controllers/messageController.js` (all error handlers), `backend/middleware/error.js`, `backend/server.js` (inline error handler)
**Severity:** High

**Description:** Multiple error handlers send `error.message` directly to the client:

```js
res.status(500).json({ success: false, message: error.message });
```

The centralized error middleware also includes stack traces when `NODE_ENV === 'development'`:

```js
...(process.env.NODE_ENV === 'development' && { stack: err.stack })
```

**Impact:** Internal error messages from MongoDB, filesystem errors, or stack traces can reveal database structure, file paths, library versions, and internal logic — aiding attackers in reconnaissance.

**Recommendation:**
- Never send `error.message` or `error.stack` to clients in production.
- Return a generic error message in production: `"Internal server error"`.
- Log detailed errors server-side only (using a logging library like Winston or Pino, not `console.error`).
- Ensure `NODE_ENV` is set to `'production'` in deployed environments.

---

### H-6: PII disclosure via conversation endpoint

**Location:** `backend/controllers/messageController.js`, `getConversation` function
**Severity:** High

**Description:** The `getConversation` endpoint returns the full `otherUser` object in the response:

```js
res.json({ success: true, data: { messages, user: otherUser, hasMore } });
```

The `User` model's `toJSON` only strips `password` and `verificationToken`. All other fields — `email`, `phone`, `moneroAddress`, `ethereumAddress`, `fullName`, `bio`, `legalIdentity` (including UEN, entity name, verification status), `accreditationDocuments`, `stats` — are exposed to any authenticated user who queries a conversation with another user.

**Impact:** Any user can enumerate other users' PII including contact details, wallet addresses, and legal entity information by calling `GET /api/messages/conversation/:userId` with any valid user ID.

**Recommendation:**
- Return only the fields needed for the conversation UI: `{ username, fullName }`.
- Implement a separate admin-only endpoint for accessing full user profiles.
- Apply a consistent DTO/response-shaping layer to prevent accidental field leakage.

---

## Medium Findings

### M-1: Governance griefing: no proposal threshold blocks all transfers

**Location:** `backend/contracts/AssetTokenization.sol`, `propose` (line 206), `_transfer` (line 285)
**Severity:** Medium

**Description:** The `propose()` function requires only `balanceOf[msg.sender] > 0` — any holder with a single token unit can create proposals. While a proposal is active, `_transfer()` blocks ALL transfers via `require(activeProposalCount == 0)`. There is no minimum token threshold for creating proposals and no limit on the number of proposals per holder.

A malicious holder with a minimal balance can create successive proposals (each with a 7-day+ voting period) to indefinitely block all token transfers — a denial-of-service griefing attack.

**Impact:** Token transfers frozen indefinitely; marketplace trading and liquidity halted. Cost to attacker: 1 token unit.

**Recommendation:**
- Require a minimum token balance (e.g., 0.1% of `totalSupply`) to create proposals.
- Add a proposal deposit (e.g., slashed if the proposal is canceled for spam).
- Limit the number of active proposals per address.
- Consider not blocking transfers during proposals, or only blocking transfers involving active voters' balances (snapshot-based).

---

### M-2: Smart contract centralization: no timelock/multisig

**Location:** `backend/contracts/AssetTokenization.sol`, `onlyOwner` modifier (line 67), functions: `setTransferAllowed`, `setTransfersRestricted`, `updateTreasury`, `updateAssetValuation`, `updateAssetUri`, `updateGovernanceSettings`, `transferOwnership`
**Severity:** Medium

**Description:** The contract owner has unilateral control over critical protocol parameters: transfer policy (can freeze/unfreeze all transfers), asset valuation (affects `tokenPrice()`), treasury address (where sale proceeds go), governance settings, and ownership transfer. There is no timelock, no multisig, and no governance vote required for these admin actions.

**Impact:** A compromised or malicious owner can instantly change the treasury to their own address, raise/lower asset valuations to manipulate prices, freeze transfers, or rug the protocol.

**Recommendation:**
- Wrap admin functions behind a timelock (e.g., OpenZeppelin `TimelockController`) giving token holders notice to react.
- Use a multisig (e.g., Gnosis Safe) for owner role.
- Route critical parameter changes through the governance proposal system.

---

### M-3: Missing event emission for `updateGovernanceSettings`

**Location:** `backend/contracts/AssetTokenization.sol`, `updateGovernanceSettings` (line 191)
**Severity:** Medium

**Description:** The `updateGovernanceSettings` function changes `votingPeriod` and `quorumBps` without emitting any event. All other admin functions in the contract emit events (`TransferPolicyUpdated`, `TreasuryUpdated`, `AssetValuationUpdated`, `AssetUriUpdated`, `OwnershipTransferred`).

**Impact:** Token holders and off-chain monitors cannot detect changes to governance parameters without polling contract storage. This reduces transparency and auditability.

**Recommendation:**
```solidity
event GovernanceSettingsUpdated(uint256 previousVotingPeriod, uint256 newVotingPeriod, uint256 previousQuorumBps, uint256 newQuorumBps);
// Add in updateGovernanceSettings:
emit GovernanceSettingsUpdated(votingPeriod, newVotingPeriod, quorumBps, newQuorumBps);
```

---

### M-4: `unchecked` arithmetic blocks reduce defense-in-depth

**Location:** `backend/contracts/AssetTokenization.sol`, `_transfer` (lines 295-297), `transferFrom` (lines 152-154)
**Severity:** Medium

**Description:** Both `_transfer` and `transferFrom` use `unchecked` blocks for arithmetic operations that are guarded by preceding `require` checks. While these checks prevent underflow in the current code path, the `unchecked` blocks permanently disable Solidity 0.8.x overflow protection for those statements. If the contract is modified and the require checks are reordered or removed, the unchecked blocks would enable silent integer underflow.

```solidity
// _transfer (line 295)
unchecked {
    balanceOf[from] -= value;
}

// transferFrom (line 152)
unchecked {
    allowance[from][msg.sender] = currentAllowance - value;
}
```

**Impact:** Reduced defense-in-depth; potential silent arithmetic errors if code is refactored.

**Recommendation:** Remove the `unchecked` blocks. The gas savings are negligible for an asset-tokenization contract (not high-frequency), and the overflow protection provides safety against future modifications.

---

### M-5: No zero-address check on `from` in `_transfer`

**Location:** `backend/contracts/AssetTokenization.sol`, `_transfer` (line 284)
**Severity:** Medium

**Description:** The `_transfer` function applies `validAddress(to)` but does NOT validate `from`:

```solidity
function _transfer(address from, address to, uint256 value) internal validAddress(to) {
```

The `transfer` function uses `msg.sender` as `from` (never zero), and `transferFrom` uses user-specified `from`. While `balanceOf[address(0)]` is 0 (preventing non-zero transfers), a 0-value `transferFrom(address(0), recipient, 0)` would succeed and emit a `Transfer(0, recipient, 0)` event — a spurious event from the zero address.

**Impact:** Spurious zero-address transfer events; violates ERC-20 best practices.

**Recommendation:**
```solidity
function _transfer(address from, address to, uint256 value) internal validAddress(from) validAddress(to) {
```

---

### M-6: Inconsistent/duplicate JWT middleware

**Location:** `routes/messages.js` (inline `authenticateJWT`), `backend/middleware/auth.js` (`authenticate` export)
**Severity:** Medium

**Description:** Two separate JWT verification implementations exist:
1. `backend/middleware/auth.js`: loads the full User document from DB, checks `isActive`, attaches `req.user` as a Mongoose document.
2. `routes/messages.js`: inline `authenticateJWT` that decodes the JWT payload directly, attaches `req.user` as the raw decoded object (`{ id, email, role }`), does NOT load the user from DB, does NOT check `isActive`.

The message controller then accesses `req.user._id` (Mongoose ObjectId), but the inline middleware sets `req.user = { id, ... }` (no `_id` field). This mismatch would cause MongoDB queries to receive `undefined` for the user ID if the root `server.js` entry point is used instead of `backend/server.js`.

Additionally, `routes/messages.js` references controller methods `getConversationWithUser` and `deleteMessage` that do not exist in `messageController.js`, causing runtime errors if those routes are hit.

**Impact:** Authentication bypass (issuing active check skipped), runtime errors, and maintenance confusion from duplicate auth logic.

**Recommendation:**
- Delete the inline `authenticateJWT` from `routes/messages.js`.
- Import and use `authenticate` from `backend/middleware/auth.js` consistently.
- Ensure `req.user` always points to the loaded Mongoose document with `_id`.
- Add the missing `getConversationWithUser` and `deleteMessage` controller methods or remove the route definitions.

---

### M-7: WebSocket event inputs not validated

**Location:** `websocket/server.js`, `send-message` (line ~42), `typing` (line ~52), `mark-read` (line ~55)
**Severity:** Medium

**Description:** WebSocket event handlers accept unvalidated input:
- `send-message`: `recipientId`, `content`, `orderId`, `attachments` are taken directly from the client event data with no schema validation, no size limits, no content sanitization.
- `typing`: `recipientId` is used to emit to arbitrary rooms — a user can emit typing indicators to any recipient.
- `mark-read`: Uses `read: false` in the MongoDB filter, but the `Message` model uses the field `status` (enum: `sent`/`delivered`/`read`/`failed`), not a boolean `read` field. This query will never match any documents.

**Impact:**
- Stored XSS if message content renders as HTML on the recipient's client without sanitization.
- Arbitrary user harassment via unsolicited typing indicators.
- `mark-read` silently fails — messages are never marked as read via WebSocket.

**Recommendation:**
- Validate all WebSocket event payloads with a schema (Joi or similar).
- Rate-limit message sends per socket per second.
- Fix `mark-read` to use `status: { $in: ['sent', 'delivered'] }` instead of `read: false`.
- Sanitize message content (server-side) or enforce client-side escaping.

---

### M-8: Mobile JWT stored in Redux (potential insecure persistence)

**Location:** `mobile/src/store/authSlice.js`
**Severity:** Medium

**Description:** The auth slice stores the JWT in Redux state (`state.token`). If Redux Persist or a similar persistence layer is configured (common pattern in React Native), the token is serialized to `AsyncStorage` — which on Android is stored in plain-text SQLite or SharedPreferences, accessible to root-level malware and backup extraction.

**Impact:** JWT tokens may be extracted from device storage via backup, physical access, or malware, enabling session hijacking.

**Recommendation:**
- Use `expo-secure-store` or `react-native-keychain` to store JWT tokens in the platform secure enclave/keystore.
- If using Redux Persist, exclude the `token` field from persistence and re-hydrate from secure storage on app start.
- Shorten JWT expiry (e.g., 15-minute access + refresh token) to limit exposure window.

---

### M-9: ERC-20 approve race condition

**Location:** `backend/contracts/AssetTokenization.sol`, `approve` (line 142)
**Severity:** Medium

**Description:** The `approve` function implements standard ERC-20 approval, which is susceptible to the well-known approve race condition: if a spender has an existing non-zero allowance, calling `approve(spender, new_value)` allows the spender to front-run the transaction and use both the old and new allowances before the new value takes effect.

**Impact:** An approved spender could receive more tokens than intended.

**Recommendation:**
- Implement `increaseAllowance` and `decreaseAllowance` (EIP-2612 permit pattern).
- Alternatively, require setting allowance to 0 before changing to a new non-zero value.
- Consider implementing EIP-2612 signed permits for gas-less approvals.

---

## Low / Informational Findings

### L-1: No email verification on registration

**Location:** `backend/controllers/authController.js`, `register` function
**Severity:** Low

**Description:** The registration endpoint creates a user with `isActive: true` immediately, without sending a verification email or requiring email confirmation. The User model has `verificationToken` and `verificationExpires` fields but they are never populated by the registration flow.

**Impact:** Users can register with fake or arbitrary email addresses. Email enumeration and spam registration are possible.

**Recommendation:** Implement email verification: set `isActive: false` on registration, generate a `verificationToken`, send a verification email, and activate the account on token verification.

---

### L-2: Token price integer division truncation

**Location:** `backend/contracts/AssetTokenization.sol`, `tokenPrice` (line 126)
**Severity:** Low

**Description:** `tokenPrice()` returns `assetValuation / totalFractions` using integer division. For non-exact divisions, the fractional remainder is silently truncated. For example, `assetValuation = 1,000,001` and `totalFractions = 3` yields `333,333` (losing `0.67` per token).

**Impact:** Minor pricing inaccuracy. No direct security impact, but may cause financial discrepancies in order calculations.

**Recommendation:** Document the rounding behavior or use fixed-point arithmetic with explicit rounding direction.

---

### L-3: Root `server.js` missing security middleware

**Location:** `server.js` (root)
**Severity:** Low

**Description:** The root `server.js` entry point (used for the stand-alone messaging server) does not use `helmet`, `compression`, or any rate-limiting middleware. It does use `cors()` with default (all-origins) options. The `backend/server.js` entry point is better hardened (includes `helmet`).

**Impact:** Reduced security posture for deployments using the root server entry point.

**Recommendation:** Add `helmet()` and rate-limiting to root `server.js`, or consolidate to a single entry point with consistent security middleware.

---

### L-4: No token revocation/blacklist mechanism

**Location:** `backend/controllers/authController.js` (`logout` does nothing), `mobile/src/services/authService.js` (`logout` is client-side only)

**Severity:** Low

**Description:** The `logout` controller returns success without invalidating the JWT. Since tokens are stateless with a 7-day expiry, a leaked token remains valid until natural expiration. There is no token blacklist or revocation list.

**Impact:** Stolen or leaked JWTs remain valid for up to 7 days.

**Recommendation:**
- Implement a token blacklist (Redis-set based) for logout/password-change events.
- Reduce JWT expiry to 15-30 minutes with a refresh token mechanism.
- On password change (H-2 fix), invalidate all existing tokens for the user.

---

### L-5: API defaults to HTTP in mobile config

**Location:** `mobile/src/constants/config.js`
**Severity:** Low

**Description:** The mobile config defaults to `http://localhost:3000/api` and `ws://localhost:3000` when environment variables are not set. If production builds are deployed without setting `API_URL`/`WS_URL`, the app communicates over plaintext HTTP/WS, exposing JWT tokens and all API traffic to network interception.

**Impact:** Man-in-the-middle attacks on app traffic if deployed with default config.

**Recommendation:** Default to HTTPS (`https://`) and WSS (`wss://`) in production builds. Fail to compile if `API_URL` is not set when `NODE_ENV=production`.

---

### L-6: No certificate pinning on mobile API client

**Location:** `mobile/src/services/api.js`
**Severity:** Informational

**Description:** The axios API client does not configure SSL certificate pinning. On mobile, this means the app trusts any CA-issued certificate, making it vulnerable to MITM via compromised or corporate CAs.

**Impact:** Potential interception of API traffic through rogue certificates.

**Recommendation:** Use `react-native-ssl-pinning` or equivalent to pin the production server's certificate or public key. At minimum, pin the SHA-256 hash of the public key.

---

## Summary

### By severity

- **Critical (2):** Committed secrets (C-1), bypassable JWT via hardcoded fallback (C-2)
- **High (6):** Mass assignment privilege escalation (H-1), password change without verification (H-2), no rate limiting (H-3), CORS all-origins (H-4), error leakage (H-5), PII disclosure (H-6)
- **Medium (9):** Governance griefing (M-1), contract centralization (M-2), missing event (M-3), unchecked blocks (M-4), zero-address check (M-5), duplicate JWT middleware (M-6), unvalidated WebSocket events (M-7), insecure mobile token storage (M-8), approve race condition (M-9)
- **Low/Informational (6):** No email verification (L-1), price truncation (L-2), missing root security middleware (L-3), no token revocation (L-4), HTTP default mobile config (L-5), no certificate pinning (L-6)

### Positive observations

- Bcrypt password hashing with salt rounds 12 (industry standard)
- User model `toJSON` strips `password` and `verificationToken`
- Joi input validation in `tokenController.js` and `acraController.js` with `stripUnknown` and detailed schemas
- `helmet()` is used in `backend/server.js`
- Smart contract uses Solidity 0.8.x with built-in overflow checks (partially — see M-4)
- Transfer restrictions during active proposals provide partial flash-loan protection
- Constructor validates fractions, reserve, quorum, and voting period bounds

### Remediation priority

1. **Immediate:** C-1 (remove/revoke secrets), C-2 (remove JWT fallback), H-1 (mass assignment allowlist)
2. **Short-term:** H-2 through H-6 (password verification, rate limiting, CORS, error handling, PII)
3. **Medium-term:** M-1 through M-9 (governance, contract hardening, WebSocket validation, mobile storage)
4. **Long-term:** L-1 through L-6 (email verification, token revocation, mobile hardening)

---

*This audit was conducted using static analysis of the source code at the repository head. It does not constitute a guarantee of security and should be supplemented with dynamic testing, penetration testing, and formal verification for production deployment.*
*Developed with AI assistance and disclosed transparently.*
