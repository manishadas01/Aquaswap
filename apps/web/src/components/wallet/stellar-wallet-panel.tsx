'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/use-stellar-wallet';
import { detectFreighter } from '../../lib/stellar-wallet';

export function StellarWalletPanel() {
  const {
    address,
    balance,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
    sendXlm,
  } = useWallet();

  const [hasFreighter, setHasFreighter] = useState<boolean>(true);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    detectFreighter().then(setHasFreighter);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxHash(null);
    setTxError(null);
    if (!toAddress || !amount) return;

    try {
      const result = await sendXlm(toAddress, amount);
      setTxHash(result.hash);
      setToAddress('');
      setAmount('');
    } catch (err: any) {
      setTxError(err.message || 'Transaction failed');
    }
  };

  if (!hasFreighter) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Stellar Wallet</h2>
        <p className="text-gray-600 mb-6">Freighter extension is not detected.</p>
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Install Freighter
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stellar Wallet</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      {!isConnected ? (
        <div className="text-center">
          <button
            onClick={connect}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : null}
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Connected Address</p>
            <p className="font-mono text-sm text-gray-700 break-all mb-4">{address}</p>
            
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Balance</p>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xl font-bold text-gray-900">{balance ? `${balance} XLM` : 'Loading...'}</p>
              <button
                onClick={refreshBalance}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
              >
                Refresh Balance
              </button>
            </div>

            <button
              onClick={disconnect}
              disabled={isLoading}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-md transition-colors border border-red-200"
            >
              Disconnect
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Send XLM</h3>
            
            {txHash && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200 break-all">
                <p className="font-semibold mb-1">Transaction sent!</p>
                <p>Hash: {txHash}</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-800 underline mt-2 inline-block font-medium hover:text-green-900"
                >
                  View on Explorer
                </a>
              </div>
            )}

            {txError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                {txError}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label htmlFor="toAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Address
                </label>
                <input
                  id="toAddress"
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="G..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (XLM)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.0000001"
                  min="0.0000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !toAddress || !amount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                Send XLM
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
