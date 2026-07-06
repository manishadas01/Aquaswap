# Architecture Document

## System Overview
AquaSwap consists of two main components:
1. Soroban Smart Contracts (Rust)
2. Next.js Frontend App (React/TypeScript)

## Smart Contracts Architecture
- **Factory (`aqua_swap_factory`)**: Responsible for instantiating new `Pair` contracts.
- **Router (`aqua_swap_router`)**: The primary interface for users to add liquidity, remove liquidity, and swap tokens. Handles multi-hop swaps and deadline checks.
- **Pair (`aqua_swap_pair`)**: The core AMM pool holding `reserve_0` and `reserve_1`. Implements the constant product formula ($x * y = k$).

## Frontend Architecture
- **State Management**: React Context / Hooks for wallet state.
- **Wallet Connection**: Uses `@stellar/freighter-api`.
- **Styling**: TailwindCSS with `radix-ui` headless components for accessible modals, dialogs, and tooltips.
