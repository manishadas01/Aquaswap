import { useEffect, useState, useRef } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

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
  const lastLedgerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!contractAddress) return;

    let isSubscribed = true;
    const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");

    const fetchEvents = async () => {
      try {
        setIsListening(true);
        
        // Initialize start ledger by fetching latest ledger
        if (lastLedgerRef.current === null) {
            const network = await server.getNetwork();
            // Assuming network info contains a way to get recent ledger, or we just start from 0
            // Actually getLatestLedger is available
            const latest = await server.getLatestLedger();
            lastLedgerRef.current = latest.sequence;
        }

        const eventPoller = setInterval(async () => {
           if(!isSubscribed || !lastLedgerRef.current) return;
           try {
             const response = await server.getEvents({
               startLedger: lastLedgerRef.current,
               filters: [
                 {
                   type: "contract",
                   contractIds: [contractAddress],
                   topics: []
                 }
               ],
               limit: 100
             });
             
             if (response.events && response.events.length > 0) {
               const newEvents = response.events.map((e: any) => ({
                 id: e.id,
                 type: e.type,
                 ledger: e.ledger,
                 contractId: e.contractId,
                 topic: e.topic,
                 value: e.value
               }));
               setEvents(prev => [...prev, ...newEvents]);
               lastLedgerRef.current = response.latestLedger;
             }
           } catch (err) {
             console.error("Error polling events:", err);
           }
        }, 5000);

        return () => clearInterval(eventPoller);
      } catch (error) {
        console.error("Error setting up event streaming:", error);
        setIsListening(false);
      }
    };

    const cleanup = fetchEvents();

    return () => {
      isSubscribed = false;
      setIsListening(false);
      cleanup.then(c => c && c());
    };
  }, [contractAddress]);

  return { events, isListening };
};
