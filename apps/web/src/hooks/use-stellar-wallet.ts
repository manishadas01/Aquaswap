import { useState, useEffect, useCallback } from 'react';
import {
  detectFreighter,
  connectWallet,
  getWalletAddress,
  signTx,
} from '../lib/stellar-wallet';
import {
  fetchXlmBalance,
  buildPaymentXdr,
  submitSignedTx,
} from '../lib/stellar-sdk';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const hasFreighter = await detectFreighter();
      if (!hasFreighter) {
        setIsConnected(false);
        return;
      }
      const addr = await getWalletAddress();
      if (addr) {
        setAddress(addr);
        setIsConnected(true);
        const bal = await fetchXlmBalance(addr);
        setBalance(bal);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect wallet connection');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      setIsConnected(true);
      const bal = await fetchXlmBalance(addr);
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setIsConnected(false);
    setError(null);
  };

  const refreshBalance = async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const bal = await fetchXlmBalance(address);
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh balance');
    } finally {
      setIsLoading(false);
    }
  };

  const sendXlm = async (to: string, amount: string): Promise<{ hash: string }> => {
    if (!address) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    try {
      const xdr = await buildPaymentXdr(address, to, amount);
      const signedXdr = await signTx(xdr);
      const result = await submitSignedTx(signedXdr);
      await refreshBalance();
      return result;
    } catch (err: any) {
      const msg = err.message || (err.response && err.response.data && err.response.data.title) || 'Transaction failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    address,
    balance,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
    sendXlm,
  };
}
