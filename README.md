# AquaSwap DEX

AquaSwap is a decentralized exchange (DEX) on the Stellar Network using Soroban Smart Contracts.

## Executive Summary
AquaSwap provides automated market making (AMM) for Stellar assets. It features a complete smart contract architecture (Factory, Router, Pair, Token), a responsive frontend, and comprehensive testing.

## Features
* **AMM Liquidity Pools**: Create and trade against automated liquidity pools.
* **Token Swaps**: Swap any two Stellar Soroban tokens.
* **Mobile Responsive Frontend**: A fast, responsive UI built with Next.js and TailwindCSS.
* **Wallet Integration**: Native integration with Stellar Freighter wallet.
* **Real-time Event Streaming**: Listens to on-chain events and updates UI immediately.
* **Robust Error Handling**: Graceful fallback and error states.

## Architecture
### Smart Contracts
* `aqua_swap_router`: Entrypoint for users to add/remove liquidity and swap tokens securely.
* `aqua_swap_factory`: Deploys new pairs and tracks existing pairs.
* `aqua_swap_pair`: Core AMM logic holding reserves and minting LP tokens.
* `aqua_swap_token`: Standard token implementation for LP tokens.

### Frontend Architecture
* Built with **Next.js App Router**, **React 19**, and **TailwindCSS**.
* Radix UI for accessible components.
* State management using React context and custom hooks.
* Real-time events managed by `@stellar/stellar-sdk` RPC integration.
* Vitest and React Testing Library for component testing.

## Technology Stack
* **Smart Contracts**: Rust, Soroban SDK
* **Frontend**: TypeScript, Next.js, React, TailwindCSS, Vitest
* **CI/CD**: GitHub Actions

## Environment Variables
Create a `.env.local` file in `apps/web/` containing:
```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_FACTORY_CONTRACT_ID=CAKPZ6T2EVS3UQQ2ULYRKTGSOCMGIWTWHGHV5NBHH63DVCQLVGVCRIZV
NEXT_PUBLIC_ROUTER_CONTRACT_ID=CD2D5ZP5XY7VB7ZZUUZVD46FB4BZN3UJLRAOMSN52ZZKQVSFWTQRPCY2
```

## Installation Guide
1. Clone the repository.
2. Install frontend dependencies: `cd apps/web && npm install`
3. Build contracts: `make build`

## Deployment Guide
### Smart Contracts Deployment
Requirements: Stellar CLI
1. Generate deployer key: `stellar keys generate deployer`
2. Fund deployer: `stellar keys fund deployer --network testnet`
3. Deploy: `make deploy STELLAR_SECRET_KEY=deployer`

Deployed to Stellar Testnet:
* **Router**: CD2D5ZP5XY7VB7ZZUUZVD46FB4BZN3UJLRAOMSN52ZZKQVSFWTQRPCY2
* **Factory**: CAKPZ6T2EVS3UQQ2ULYRKTGSOCMGIWTWHGHV5NBHH63DVCQLVGVCRIZV
* **Pair**: CAYNUQWIPYNLUHRWQNB36X4ZMSHTJDIMKRMFE7IAWWBARL23RO2X3OE4

### Frontend Deployment Workflow
* The application can be easily deployed on Vercel.
* **Environment Configuration**: Set `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_FACTORY_CONTRACT_ID`, and `NEXT_PUBLIC_ROUTER_CONTRACT_ID` in Vercel project settings.
* **Build process**: Handled automatically via `npm run build`.
* **Rollback strategy**: Vercel supports instant rollbacks to previous production deployments from the dashboard.

## Links

| Resource | Link |
|----------|------|
| 🚀 Live Demo | [Open App](https://aquaswapstellar.vercel.app/) |
| 🎥 Demo Video | [Watch Demo](https://www.youtube.com/watch?v=SNSfZNZxg74) |

## Mobile Responsive

<img width="361" height="732" alt="Screenshot 2026-07-06 at 8 44 29 PM" src="https://github.com/user-attachments/assets/51e37ba6-764f-4ec1-adb5-1df11757b4ca" />

## Event Streaming Architecture
The frontend leverages Stellar SDK and Soroban RPC to stream contract events (e.g., `Swap`, `Mint`, `Burn`). When an event is detected, the frontend updates the local store to reflect the new balances and reserves in real-time.

## Testing Instructions
* **Contracts**: Run `make test` from root.
* **Frontend**: Run `npm test` from `apps/web`.

## CI/CD Pipeline

<img width="1453" height="828" alt="Screenshot 2026-07-06 at 11 57 54 PM" src="https://github.com/user-attachments/assets/f147d840-770c-42e8-83fa-c34b381e88b0" />

GitHub Actions automatically builds contracts, runs Rust clippy, tests contracts, builds the Next.js app, runs ESLint, typecheck, and frontend tests on every push and PR to `main`.

## Troubleshooting Guide
* Ensure your Freighter wallet is on Testnet.
* If transactions fail, ensure you have funded your account using `stellar keys fund`.


