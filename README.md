# 💬 P2P Real-Time Investor Messaging System (WebSocket + Socket.io)

This repository provides a real-time peer-to-peer messaging system for investors and platform admins built with Express, Socket.io, JWT Authentication, and MongoDB.

---

## 🚀 Features

- **Direct 1-on-1 Messaging:** Real-time Socket.io message transport.
- **Order Context Integration:** Messages attached to specific order IDs.
- **Typing Indicators & Read Receipts:** Real-time `typing` and `mark-read` events.
- **JWT Security:** All REST endpoints and WebSocket connections authenticated via JWT tokens.

---

## 📡 API Endpoints

- `GET /api/messages/conversations` - Get all active conversations.
- `GET /api/messages/conversation/:userId` - Get message history with a user.
- `POST /api/messages/send` - Send a message via REST API.
- `PUT /api/messages/read` - Mark messages as read.
- `GET /api/messages/unread` - Get unread count badge.
- `DELETE /api/messages/:id` - Delete message (admin/user).

---

## 💳 Monero Payout Address

`0.07 XMR Payout Address:` `0x88760d23C8ddA58B8001e9A1101EB3dca65e4EbA`
