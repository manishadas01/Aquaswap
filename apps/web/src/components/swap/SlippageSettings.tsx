'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PRESETS = [0.1, 0.5, 1.0];

interface SlippageSettingsProps {
  value: number;
  onChange: (value: number) => void;
}

export function SlippageSettings({ value, onChange }: SlippageSettingsProps) {
  const [custom, setCustom] = useState('');
  const isPreset = PRESETS.includes(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Slippage settings"
        >
          <Settings2 className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 border-white/15 bg-neutral-900/95 text-white backdrop-blur-xl"
      >
        <p className="mb-2 text-xs font-medium text-white/60">Slippage tolerance</p>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setCustom('');
                onChange(preset);
              }}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-semibold transition',
                isPreset && value === preset
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20',
              )}
            >
              {preset}%
            </button>
          ))}
        </div>
        <div className="relative mt-1.5">
          <Input
            value={custom}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '');
              setCustom(v);
              const num = parseFloat(v);
              if (!Number.isNaN(num) && num > 0 && num <= 50) onChange(num);
            }}
            placeholder="Custom"
            className={cn(
              'h-[30px] border-white/15 bg-white/10 pr-6 text-right text-xs text-white placeholder:text-white/30',
              !isPreset && 'border-white/40',
            )}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40">
            %
          </span>
        </div>
        {value > 5 && (
          <p className="mt-2 text-xs text-amber-400">High slippage — you may get a worse price.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
