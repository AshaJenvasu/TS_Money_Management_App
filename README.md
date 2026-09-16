# Money Management App

A simple personal finance management app for tracking income, expenses, and investment portfolios.

## Features

- 🔐 Register & Login with JWT authentication
- 👛 Create and manage unlimited wallets
- 💸 Track income and expenses with notes
- 📊 Calculate wallet balances from actual transactions
- 📈 Manually track stock and crypto investments
- 🪙 Track asset holdings and average cost
- 🔒 User data is isolated and protected by authorization

## MVP Scope

This project focuses on personal use and keeps the system simple.

- No real-time market price API
- No transaction categories
- No RBAC
- No refresh tokens or email verification
- Investment cost is calculated using Average Cost

## Tech Stack

- Backend: Bun + Hono
- Database: PostgreSQL
- Frontend: React + TypeScript + Vite

## Development Order

```text
Database Design
      ↓
Backend API
      ↓
Frontend
