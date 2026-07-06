'use client';

import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/context/WalletContext';

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function ConnectButton() {
  const { publicKey, network, isConnected, isConnecting, connect, disconnect } = useWallet();

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        className="h-10 rounded-full bg-white px-5 text-black hover:bg-white/90"
      >
        <Wallet className="size-4" />
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
        >
          <span className="size-2 rounded-full bg-emerald-400" />
          {shortenAddress(publicKey!)}
          {network && <span className="text-xs text-white/50">{network}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/20 bg-black/90 text-white backdrop-blur-xl">
        <DropdownMenuItem
          onClick={disconnect}
          className="cursor-pointer focus:bg-white/10 focus:text-white"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
