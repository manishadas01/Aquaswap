import React from 'react';
import { Spinner } from './ui/spinner';
import { CheckCircle2, XCircle } from 'lucide-react';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

interface TransactionStatusProps {
  status: TxStatus;
  hash?: string;
  errorMessage?: string;
}

export function TransactionStatus({ status, hash, errorMessage }: TransactionStatusProps) {
  if (status === 'idle') return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      {status === 'pending' && (
        <div className="flex items-center gap-3">
          <Spinner className="size-6 text-primary" />
          <span className="text-sm font-medium">Transaction pending... Please confirm in wallet.</span>
        </div>
      )}
      
      {status === 'success' && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="size-6" />
            <span className="text-sm font-medium">Transaction Successful!</span>
          </div>
          {hash && (
             <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
               View on Stellar Expert
             </a>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="size-6" />
          <span className="text-sm font-medium">{errorMessage || "Transaction failed"}</span>
        </div>
      )}
    </div>
  );
}
