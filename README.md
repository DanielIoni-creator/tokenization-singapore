# 🏢 Tokenization Singapore

**Real estate and asset tokenization platform for the Singapore market, powered by Monero and MyZubster.**

[![License](https://img.shields.io/github/license/DanielIoni-creator/tokenization-singapore)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DanielIoni-creator/tokenization-singapore)](https://github.com/DanielIoni-creator/tokenization-singapore/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/DanielIoni-creator/tokenization-singapore)](https://github.com/DanielIoni-creator/tokenization-singapore/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/DanielIoni-creator/tokenization-singapore)](https://github.com/DanielIoni-creator/tokenization-singapore/commits/master)

> **Part of the [MyZubster ecosystem](https://github.com/MyZubster-Ecosystem)**

---

## 🌏 What is Tokenization Singapore?

Tokenization Singapore is a specialized module of the MyZubster ecosystem designed for the **legal tokenization of real estate and other assets** in compliance with Singapore regulations.

It integrates with:
- **ACRA** (Accounting and Corporate Regulatory Authority) for UEN validation.
- **data.gov.sg** for official business lookups.
- **Monero (XMR)** for privacy-first payments.
- **SPV (Special Purpose Vehicle)** for legal identity verification.

---

## 🧱 Architecture

The platform is built as a modular Node.js backend with the following components:

| Component | Description |
|-----------|-------------|
| **ACRA Service** | UEN validation and company lookup via ACRA/data.gov.sg APIs. |
| **SPV Verification** | Legal identity verification for tokenized assets. |
| **Token Registry** | On-chain and off-chain management of tokenized assets. |
| **Admin API** | Manage tokenization requests, verify users, and monitor activity. |
| **Security Audit** | Comprehensive security review and best practices. |

---

## 🚀 Features

- ✅ **UEN Normalization & Validation** – verify Singapore business entities.
- ✅ **ACRA/data.gov.sg Lookup Adapter** – fetch official company data.
- ✅ **SPV Legal‑Identity Verification** – comply with Singapore regulations.
- ✅ **Token Registry Linkage** – connect legal entities to tokenized assets.
- ✅ **Admin API Endpoints** – manage and monitor tokenization.
- ✅ **Security Audit Report** – documented in `docs/SECURITY_AUDIT.md`.
- ✅ **Investor Dashboard** – view tokenized assets and verification status.

---

## 📦 Installation

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB (for data persistence)
- Monero wallet (for payment processing)

### Steps

```bash
# Clone the repository
git clone https://github.com/DanielIoni-creator/tokenization-singapore
cd tokenization-singapore

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Start the server
npm start
🔗 Integration with MyZubster

This module is part of the larger MyZubster ecosystem. It communicates with:

    MyZubsterGateway – for Monero payments and transaction monitoring.

    MyZubster-Marketplace – for listing tokenized assets.

    MyZubsterWeb – for user-facing dashboards.

🤝 How to Contribute

We welcome contributions! Check out the open issues and the roadmap:

    Issues: https://github.com/DanielIoni-creator/tokenization-singapore/issues

    Roadmap: https://github.com/users/DanielIoni-creator/projects/1

How to Contribute

    Fork the repository.

    Create a new branch for your feature or fix.

    Submit a pull request with a clear description of your changes.

📜 License

This project is released under the MIT License – free for everyone to use, modify, and distribute.
🌐 Ecosystem Hub

MyZubster Ecosystem: https://github.com/MyZubster-Ecosystem
Related Repositories
Repository	Description
MyZubsterGateway	Monero payment engine, webhooks, monitoring
MyZubster-Marketplace	Platform for services and skills
MyZubsterWeb	Web interface for the marketplace
myzubster-docs	Documentation hub

Maintained by Daniel Ioni and the MyZubster community.
# test webhook dopo rebase
