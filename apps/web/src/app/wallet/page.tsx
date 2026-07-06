'use client';

import React from 'react';
import { StellarWalletPanel } from '../../components/wallet/stellar-wallet-panel';

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Stellar Wallet — Freighter Integration
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Connect your Freighter wallet to check balance and send testnet XLM.
          </p>
        </div>
        
        <StellarWalletPanel />
      </div>
    </div>
  );
}
