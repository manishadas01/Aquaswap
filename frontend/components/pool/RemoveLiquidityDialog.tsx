'use client';

import { useEffect, useState } from 'react';
import { Loader2, Minus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWallet } from '@/context/WalletContext';
import type { PoolInfo } from '@/lib/pools';
import { getLpBalance, getLpTotalSupply } from '@/lib/pools';
import { formatUnits } from '@/lib/units';
import { removeLiquidity } from '@/lib/soroban';

const PRESETS = [25, 50, 75, 100];

interface RemoveLiquidityDialogProps {
  pool: PoolInfo;
  onSuccess?: () => void;
}

export function RemoveLiquidityDialog({ pool, onSuccess }: RemoveLiquidityDialogProps) {
  const { publicKey, isConnected } = useWallet();
  const [open, setOpen] = useState(false);
  const [lpBalance, setLpBalance] = useState<bigint | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [pct, setPct] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !publicKey) return;
    getLpBalance(pool.address, publicKey).then(setLpBalance);
    getLpTotalSupply(pool.address).then(setTotalSupply);
  }, [open, publicKey, pool.address]);

  const liquidity = lpBalance !== null ? (lpBalance * BigInt(pct)) / 100n : 0n;
  const outX =
    totalSupply && totalSupply > 0n ? (liquidity * pool.reserveX) / totalSupply : 0n;
  const outY =
    totalSupply && totalSupply > 0n ? (liquidity * pool.reserveY) / totalSupply : 0n;

  async function handleSubmit() {
    if (!publicKey || liquidity <= 0n) return;
    setIsSubmitting(true);
    try {
      const result = await removeLiquidity({
        publicKey,
        tokenA: pool.tokenX.sac,
        tokenB: pool.tokenY.sac,
        liquidity,
        amountAMin: 0n,
        amountBMin: 0n,
        deadline: Math.floor(Date.now() / 1000) + 10 * 60,
      });
      toast.success('Liquidity removed', {
        description: `Received ${formatUnits(result.amountA, pool.tokenX.decimals)} ${pool.tokenX.symbol} + ${formatUnits(result.amountB, pool.tokenY.decimals)} ${pool.tokenY.symbol}`,
      });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Remove liquidity failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isConnected) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          <Minus className="size-3.5" />
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/15 bg-neutral-950/95 text-white backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Remove liquidity — {pool.tokenX.symbol}/{pool.tokenY.symbol}
          </DialogTitle>
        </DialogHeader>

        {lpBalance === null ? (
          <p className="text-sm text-white/50">Loading your position…</p>
        ) : lpBalance === 0n ? (
          <p className="text-sm text-white/50">You have no LP tokens in this pool.</p>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
              <p className="text-4xl font-semibold text-white">{pct}%</p>
              <div className="mt-4 flex items-center gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPct(preset)}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-xs font-semibold transition',
                      pct === preset ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20',
                    )}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 rounded-xl border border-white/10 bg-black/10 px-3 py-2.5 text-xs text-white/60">
              <div className="flex justify-between">
                <span>{pool.tokenX.symbol} you receive</span>
                <span className="text-white/80">{formatUnits(outX, pool.tokenX.decimals)}</span>
              </div>
              <div className="flex justify-between">
                <span>{pool.tokenY.symbol} you receive</span>
                <span className="text-white/80">{formatUnits(outY, pool.tokenY.decimals)}</span>
              </div>
              <div className="flex justify-between">
                <span>LP tokens burned</span>
                <span className="text-white/80">{formatUnits(liquidity, 7)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={liquidity <= 0n || isSubmitting}
              className="h-11 w-full rounded-2xl bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/50"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? 'Removing…' : 'Remove Liquidity'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
