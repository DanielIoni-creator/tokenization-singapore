# 🏢 Tokenization Platform for Singapore Real Estate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Monero](https://img.shields.io/badge/Payments-Monero-orange)](https://www.getmonero.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.x-brightgreen)](https://www.mongodb.com/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue)](https://ethereum.org/)

> **Tokenize prime Singapore real estate with Monero payments.**

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

## 📊 Live Stats

| Metric | Value |
|--------|-------|
| **Tokens Created** | 3 (2 Active) |
| **Total Supply** | 18,000 Tokens |
| **Tokens Sold** | 2,470 (13.7%) |
| **Total Raised** | 2.47M SGD (≈ 1.85M USD) |
| **Investors** | 12 |
| **Orders Processed** | 34 |
| **Completed Orders** | 28 |
| **Total Fees Earned** | 94,500 SGD |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Smart Contracts** | Solidity (ERC-20), OpenZeppelin, Hardhat |
| **Payments** | Monero (XMR) via RPC |
| **Blockchain** | Ethereum (Sepolia testnet) |
| **Authentication** | JWT |
| **Security** | Helmet, CORS, Rate Limiting |
| **Documentation** | Swagger/OpenAPI (Coming soon) |
| **Containerization** | Docker (Planned) |
| **Privacy** | PGP Encryption (Planned) |

## 🗂️ Project Structure

tokenization-singapore/
├── backend/ # Node.js API server
│ ├── controllers/ # Route controllers
│ │ ├── authController.js
│ │ ├── tokenController.js
│ │ ├── orderController.js
│ │ └── adminController.js
│ ├── models/ # MongoDB models
│ │ ├── User.js
│ │ ├── Token.js
│ │ └── Order.js
│ ├── routes/ # API route definitions
│ │ ├── auth.js
│ │ ├── tokens.js
│ │ ├── orders.js
│ │ └── admin.js
│ ├── middleware/ # Auth, error handling
│ │ ├── auth.js
│ │ └── error.js
│ ├── utils/ # Utilities
│ │ ├── monero.js
│ │ ├── web3.js
│ │ └── priceService.js
│ ├── scripts/ # Admin creation, deploy scripts
│ │ ├── createAdmin.js
│ │ └── deploy.js
│ ├── locales/ # i18n translations
│ │ ├── en.json
│ │ ├── it.json
│ │ └── zh.json
│ ├── .env # Environment variables
│ └── server.js # Entry point
├── contracts/ # Smart contracts
│ └── SingaporeRealEstateToken.sol
├── docs/ # Documentation
├── README.md # This file
└── LICENSE # MIT License
text


## 🚀 Quick Start

### Prerequisites

- **Node.js:** v18.x or higher
- **MongoDB:** v5.0 or higher (running locally or via Atlas)
- **Monero RPC:** A running Monero wallet RPC (or mock it for development)
- **Ethereum Node:** Infura or Alchemy endpoint (for Sepolia testnet)

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/DanielIoni-creator/tokenization-singapore.git
cd tokenization-singapore

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your MongoDB URI, Ethereum RPC URL, and Monero RPC URL

# 4. Create admin user
node scripts/createAdmin.js

# 5. Start the server
npm run dev

The API will be available at http://localhost:3000.
Environment Variables
env

# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/tokenization-singapore

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Ethereum
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_PRIVATE_KEY=your-private-key

# Monero
MONERO_RPC_URL=http://localhost:18081
MONERO_WALLET_ADDRESS=your-monero-address

# SPV Info
SPV_NAME=Singapore Real Estate Pte Ltd
SPV_REGISTRATION=202412345C
SPV_ADDRESS=1 Raffles Place, #20-01, Singapore 048616

# Admin
ADMIN_EMAIL=admin@myzubster.com
ADMIN_PASSWORD=Admin@2024

💻 API Overview
Authentication
Method	Endpoint	Description	Auth
POST	/api/auth/register	Register a new user	Public
POST	/api/auth/login	Login and receive JWT	Public
GET	/api/auth/profile	Get user profile	JWT
PUT	/api/auth/profile	Update user profile	JWT
Tokens
Method	Endpoint	Description	Auth
POST	/api/tokens	Create a new token	Admin
GET	/api/tokens	List all tokens	JWT
GET	/api/tokens/:id	Get token details	JWT
GET	/api/tokens/:id/stats	Get token statistics	JWT
POST	/api/tokens/:id/deploy	Deploy smart contract	Admin
PUT	/api/tokens/:id	Update token	Admin
Orders
Method	Endpoint	Description	Auth
POST	/api/orders	Create an order	JWT
GET	/api/orders	Get user orders	JWT
GET	/api/orders/:id	Get order details	JWT
PUT	/api/orders/:id/cancel	Cancel an order	JWT
PUT	/api/orders/:id/confirm-payment	Confirm payment	Admin
PUT	/api/orders/:id/complete	Complete an order	Admin
Admin
Method	Endpoint	Description	Auth
GET	/api/admin/dashboard	Dashboard statistics	Admin
GET	/api/admin/users	List all users	Admin
PUT	/api/admin/users/:id	Update user	Admin
🔒 Why Monero?

Monero (XMR) is used as the payment method for its unique properties:
Feature	Monero	PayPal	Bank Transfer
Micro-payments (€0.10)	✅	❌	❌
Privacy	✅	❌	❌
No bank account needed	✅	❌	❌
Global access	✅	❌	❌
Decentralized	✅	❌	❌
Low fees	✅	❌	❌
Subaddress support	✅	❌	❌
How Payments Work

    User creates an order → System generates a unique Monero subaddress

    User sends XMR → Monero RPC detects the incoming transaction

    Admin confirms payment → After 10 confirmations

    Tokens are minted → Tokens are transferred to the user's wallet

📈 Smart Contract

The SingaporeRealEstateToken contract is an ERC-20 token with additional features:



## 🚀 Quick Start

### Prerequisites

- **Node.js:** v18.x or higher
- **MongoDB:** v5.0 or higher (running locally or via Atlas)
- **Monero RPC:** A running Monero wallet RPC (or mock it for development)
- **Ethereum Node:** Infura or Alchemy endpoint (for Sepolia testnet)

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/DanielIoni-creator/tokenization-singapore.git
cd tokenization-singapore

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your MongoDB URI, Ethereum RPC URL, and Monero RPC URL

# 4. Create admin user
node scripts/createAdmin.js

# 5. Start the server
npm run dev    your changes (git commit -m 'Add some amazing feature')

    Push to the branch (git push origin feature/amazing-feature)

    Open a Pull Request with a clear description

    Include your Monero address in the PR for payment

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
📬 Contact & Community
Platform	Link
GitHub Issues	Report a bug
Telegram	t.me/myzubster
Twitter	@MyZubster
Tor Onion	http://olqcnbdlt35k2stmmwvzhvuetu2fc4us2jnn5wg6y6wlcddihfmdomid.onion
Donations	4A2M4vB... (Monero)
🌟 Acknowledgments

    OpenZeppelin for secure smart contract libraries

    Monero for privacy-preserving payments

    Ethereum for smart contract infrastructure

    All contributors who help make this project better

"Not how much you give, but how many give it." — Spiccioli in Monero


## 🇨🇳 Progetto Cina

Il progetto si sta espandendo in Cina con:

- **Tokenizzazione di asset cinesi** (energia, real estate, IP)
- **Struttura legale a Hong Kong**
- **Integrazione con BSN e AntChain**
- **Settlement in e-CNY**

### Documentazione

- [Legal Documentation](docs/cina/legal/)
- [Asset Pipeline](docs/cina/asset-pipeline/)
- [Investor Memorandum](docs/cina/investor/)
- [Launch Plan](docs/cina/china-launch.md)
- [Blockchain Setup](blockchain/china/)

### Partner Strategici

- **Seazen Group** - Modello di tokenizzazione
- **Ant Group** - Piattaforma tecnica
- **GCL Energy** - Standard e best practice
