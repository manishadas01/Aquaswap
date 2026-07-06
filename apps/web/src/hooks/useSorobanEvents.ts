import { useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';
import { HORIZON_TESTNET_URL } from '../lib/stellar-wallet';

export interface SorobanEvent {
  id: string;
  type: string;
  ledger: number;
  contractId: string;
  topic: string[];
  value: any;
}

export const useSorobanEvents = (contractAddress: string) => {
  const [events, setEvents] = useState<SorobanEvent[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!contractAddress) return;

    let isSubscribed = true;
    const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL);

    const fetchEvents = async () => {
      try {
        setIsListening(true);
        // Note: Soroban RPC events require a different server endpoint typically.
        // For demonstration, we simulate event listening loop via Horizon or standard RPC polling.
        // In a true production app, use the soroban-client Server.getEvents().
        const eventPoller = setInterval(async () => {
           if(!isSubscribed) return;
           // Poll logic would go here
        }, 5000);

        return () => clearInterval(eventPoller);
      } catch (error) {
        console.error("Error setting up event streaming:", error);
        setIsListening(false);
      }
    };

    fetchEvents();

    return () => {
      isSubscribed = false;
      setIsListening(false);
    };
  }, [contractAddress]);

  return { events, isListening };
};
