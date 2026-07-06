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

### Frontend
* Built with **Next.js**, **React 19**, and **TailwindCSS**.
* Radix UI for accessible components.
* Vitest and React Testing Library for component testing.

## Technology Stack
* **Smart Contracts**: Rust, Soroban SDK
* **Frontend**: TypeScript, Next.js, React, TailwindCSS, Vitest
* **CI/CD**: GitHub Actions

## Installation Guide
1. Clone the repository.
2. Install frontend dependencies: `cd apps/web && npm install`
3. Build contracts: `make build`

## Smart Contract Deployment Guide
Requirements: Stellar CLI
1. Generate deployer key: `stellar keys generate deployer`
2. Fund deployer: `stellar keys fund deployer --network testnet`
3. Deploy: `make deploy STELLAR_SECRET_KEY=deployer`

## Deployment
Deployed to Stellar Testnet:
* **Router**: CD2D5ZP5XY7VB7ZZUUZVD46FB4BZN3UJLRAOMSN52ZZKQVSFWTQRPCY2
* **Factory**: CAKPZ6T2EVS3UQQ2ULYRKTGSOCMGIWTWHGHV5NBHH63DVCQLVGVCRIZV
* **Pair**: CAYNUQWIPYNLUHRWQNB36X4ZMSHTJDIMKRMFE7IAWWBARL23RO2X3OE4

## Event Streaming Architecture
The frontend leverages Stellar SDK and Soroban RPC to stream contract events (e.g., `Swap`, `Mint`, `Burn`). When an event is detected, the frontend updates the local store to reflect the new balances and reserves in real-time.

## Testing Instructions
* **Contracts**: Run `make test` from root.
* **Frontend**: Run `npm test` from `apps/web`.

## CI/CD Pipeline
GitHub Actions automatically builds contracts, runs Rust clippy, tests contracts, builds the Next.js app, runs ESLint, typecheck, and frontend tests on every push and PR to `main`.

## Troubleshooting Guide
* Ensure your Freighter wallet is on Testnet.
* If transactions fail, ensure you have funded your account using `stellar keys fund`.

## Demo & Screenshots
(See `demo/` folder for videos and screenshots of the responsive interface and wallet integration).
