# 🏢 Tokenization Platform for Singapore Real Estate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Monero](https://img.shields.io/badge/Payments-Monero-orange)](https://www.getmonero.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.x-brightgreen)](https://www.mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue)](https://ethereum.org/)

> **Tokenize prime Singapore real estate with Monero payments.**

---

## 💬 Real-Time P2P Investor Messaging System (Socket.io)

This repository includes a real-time peer-to-peer messaging system for investors and platform admins built with Express, Socket.io, JWT Authentication, and MongoDB.

### Key Features
- **Direct 1-on-1 Messaging:** Real-time Socket.io message transport.
- **Order Context Integration:** Messages attached to specific order IDs.
- **Typing Indicators & Read Receipts:** Real-time `typing` and `mark-read` events.
- **JWT Security:** All REST endpoints and WebSocket connections authenticated via JWT tokens.

### API Endpoints
- `GET /api/messages/conversations` - Get all active conversations.
- `GET /api/messages/conversation/:userId` - Get message history with a user.
- `POST /api/messages/send` - Send a message via REST API.
- `PUT /api/messages/read` - Mark messages as read.
- `GET /api/messages/unread` - Get unread count badge.
- `DELETE /api/messages/:id` - Delete message (admin/user).

---

## 🚀 Overview

This platform enables the tokenization of real estate assets in Singapore, allowing for fractional ownership and investment. It combines a **Node.js/Express backend**, **MongoDB** for data persistence, **Ethereum smart contracts** (ERC-20) for token management, and **Monero (XMR)** for private, borderless payments.

### Key Features

- ✅ **Token Management:** Create and manage ERC-20 tokens representing real estate assets
- ✅ **On-Chain Deploy:** Deploy smart contracts directly from the admin panel
- ✅ **Monero Payments:** Generate unique subaddresses per order for private transactions
- ✅ **Order Lifecycle:** Track orders from creation to completion with status updates
- ✅ **Admin Dashboard:** Real-time stats and management of tokens, orders, and users
- ✅ **Multi-Language:** API responses available in multiple languages (i18n)
- ✅ **JWT Authentication:** Secure, role-based access control (Admin, Investor, User)
- ✅ **Privacy First:** No KYC required, anonymous contributions

## 💳 Monero Payout Address
`0.07 XMR Payout Address:` `0x88760d23C8ddA58B8001e9A1101EB3dca65e4EbA`

## Singapore Real Estate Tokenization

The backend includes an admin workflow for modeling Singapore real-estate tokens:

- `POST /api/tokens/fractionalize` previews token price, ownership per token, issuer reserve, investor supply, and minimum token allocation.
- `POST /api/tokens/real-estate` creates a token with Singapore property details, SLA/INLIS registry reference data, fractionalization fields, SPV UEN metadata, and compliance restrictions.
- `POST /api/tokens/:id/registry/verify` checks official registry evidence against the stored deterministic registry fingerprint and updates the token verification status.

Detailed usage and sample payloads are available in [docs/singapore-real-estate-tokenization.md](docs/singapore-real-estate-tokenization.md).

## ACRA Legal Identity Integration

The backend now includes ACRA/UEN verification for Singapore legal entities:

- `POST /api/acra/lookup` normalizes ACRA evidence or queries a configured API adapter.
- `POST /api/acra/tokens/:id/verify-spv` verifies a token SPV against ACRA entity data and stores the result under `token.spv.acra`.
- `POST /api/acra/auth/verify-entity` binds an authenticated user account to a verified Singapore legal entity.

Production API calls can be enabled with `ACRA_API_URL_TEMPLATE`, while tests and legal review can pass official evidence records directly. See [docs/acra-integration.md](docs/acra-integration.md).
