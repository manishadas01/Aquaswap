'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TokenIcon } from '@/components/TokenIcon';
import type { TokenInfo } from '@/lib/config';

interface TokenSelectorProps {
  tokens: TokenInfo[];
  value: TokenInfo;
  onChange: (token: TokenInfo) => void;
  excludeSymbol?: string;
}

export function TokenSelector({ tokens, value, onChange, excludeSymbol }: TokenSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <TokenIcon symbol={value.symbol} />
          {value.symbol}
          <ChevronDown className="size-3.5 text-white/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 border-white/15 bg-neutral-900/95 p-1.5 text-white backdrop-blur-xl"
      >
        {tokens.map((token) => {
          const disabled = token.symbol === excludeSymbol;
          const selected = token.symbol === value.symbol;
          return (
            <button
              key={token.symbol}
              type="button"
              disabled={disabled}
              onClick={() => onChange(token)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
                disabled ? 'cursor-not-allowed opacity-30' : 'hover:bg-white/10',
              )}
            >
              <TokenIcon symbol={token.symbol} />
              <span className="flex-1">
                <span className="block text-sm font-medium">{token.symbol}</span>
                <span className="block text-xs text-white/50">{token.name}</span>
              </span>
              {selected && <Check className="size-4 text-emerald-400" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
