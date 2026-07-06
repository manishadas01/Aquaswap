'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SlippageSettings } from '@/components/swap/SlippageSettings';
import { useWallet } from '@/context/WalletContext';
import type { PoolInfo } from '@/lib/pools';
import { getLpTotalSupply } from '@/lib/pools';
import { getTokenBalance } from '@/lib/balances';
import { quote, calcFirstDepositLp, calcSubsequentDepositLp } from '@/lib/amm-math';
import { parseUnits, formatUnits } from '@/lib/units';
import { addLiquidity } from '@/lib/soroban';

interface AddLiquidityDialogProps {
  pool: PoolInfo;
  onSuccess?: () => void;
}

export function AddLiquidityDialog({ pool, onSuccess }: AddLiquidityDialogProps) {
  const { publicKey, isConnected, connect } = useWallet();
  const [open, setOpen] = useState(false);
  const [amountX, setAmountX] = useState('');
  const [amountY, setAmountY] = useState('');
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [balanceX, setBalanceX] = useState<bigint | null>(null);
  const [balanceY, setBalanceY] = useState<bigint | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasReserves = pool.reserveX > 0n && pool.reserveY > 0n;

  useEffect(() => {
    if (!open) return;
    getLpTotalSupply(pool.address).then(setTotalSupply);
    if (publicKey) {
      getTokenBalance(publicKey, pool.tokenX).then(setBalanceX);
      getTokenBalance(publicKey, pool.tokenY).then(setBalanceY);
    } else {
      setBalanceX(null);
      setBalanceY(null);
    }
  }, [open, pool.address, pool.tokenX, pool.tokenY, publicKey]);

  function handleAmountXChange(value: string) {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setAmountX(value);
    if (!hasReserves) return;
    const x = parseUnits(value, pool.tokenX.decimals);
    if (x <= 0n) {
      setAmountY('');
      return;
    }
    const y = quote(x, pool.reserveX, pool.reserveY);
    setAmountY(formatUnits(y, pool.tokenY.decimals));
  }

  function handleAmountYChange(value: string) {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setAmountY(value);
    if (!hasReserves) return;
    const y = parseUnits(value, pool.tokenY.decimals);
    if (y <= 0n) {
      setAmountX('');
      return;
    }
    const x = quote(y, pool.reserveY, pool.reserveX);
    setAmountX(formatUnits(x, pool.tokenX.decimals));
  }

  function handleMaxX() {
    if (balanceX === null || balanceX <= 0n) return;
    handleAmountXChange(formatUnits(balanceX, pool.tokenX.decimals));
  }

  function handleMaxY() {
    if (balanceY === null || balanceY <= 0n) return;
    handleAmountYChange(formatUnits(balanceY, pool.tokenY.decimals));
  }

  const amountXBig = parseUnits(amountX, pool.tokenX.decimals);
  const amountYBig = parseUnits(amountY, pool.tokenY.decimals);
  const hasAmounts = amountXBig > 0n && amountYBig > 0n;
  const insufficientX = balanceX !== null && amountXBig > balanceX;
  const insufficientY = balanceY !== null && amountYBig > balanceY;

  let estimatedLp: bigint | null = null;
  if (hasAmounts) {
    if (hasReserves && totalSupply !== null) {
      estimatedLp = calcSubsequentDepositLp(
        amountXBig,
        amountYBig,
        pool.reserveX,
        pool.reserveY,
        totalSupply,
      );
    } else if (!hasReserves) {
      estimatedLp = calcFirstDepositLp(amountXBig, amountYBig);
    }
  }

  async function handleSubmit() {
    if (!publicKey) return;
    setIsSubmitting(true);
    try {
      const slippageBps = BigInt(Math.round((1 - slippage / 100) * 10_000));
      const result = await addLiquidity({
        publicKey,
        tokenA: pool.tokenX.sac,
        tokenB: pool.tokenY.sac,
        amountADesired: amountXBig,
        amountBDesired: amountYBig,
        amountAMin: hasReserves ? (amountXBig * slippageBps) / 10_000n : 0n,
        amountBMin: hasReserves ? (amountYBig * slippageBps) / 10_000n : 0n,
        deadline: Math.floor(Date.now() / 1000) + 10 * 60,
      });
      toast.success('Liquidity added', {
        description: `Minted ${formatUnits(result.lpMinted, 7)} LP tokens`,
      });
      setAmountX('');
      setAmountY('');
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Add liquidity failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  let submitLabel = 'Add Liquidity';
  if (isSubmitting) submitLabel = 'Adding…';
  else if (insufficientX) submitLabel = `Insufficient ${pool.tokenX.symbol} balance`;
  else if (insufficientY) submitLabel = `Insufficient ${pool.tokenY.symbol} balance`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full bg-white text-black hover:bg-white/90"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/15 bg-neutral-950/95 text-white backdrop-blur-2xl sm:max-w-md">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle>
            Add liquidity — {pool.tokenX.symbol}/{pool.tokenY.symbol}
          </DialogTitle>
          <SlippageSettings value={slippage} onChange={setSlippage} />
        </DialogHeader>

        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-white/50">
              <span className={insufficientX ? 'text-amber-400' : undefined}>{pool.tokenX.symbol}</span>
              {isConnected && balanceX !== null && (
                <button
                  type="button"
                  onClick={handleMaxX}
                  className="transition hover:text-white"
                >
                  Balance: {formatUnits(balanceX, pool.tokenX.decimals)}
                </button>
              )}
            </div>
            <input
              inputMode="decimal"
              placeholder="0.0"
              value={amountX}
              onChange={(e) => handleAmountXChange(e.target.value)}
              className="w-full bg-transparent text-2xl font-medium text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-white/50">
              <span className={insufficientY ? 'text-amber-400' : undefined}>{pool.tokenY.symbol}</span>
              {isConnected && balanceY !== null && (
                <button
                  type="button"
                  onClick={handleMaxY}
                  className="transition hover:text-white"
                >
                  Balance: {formatUnits(balanceY, pool.tokenY.decimals)}
                </button>
              )}
            </div>
            <input
              inputMode="decimal"
              placeholder="0.0"
              value={amountY}
              onChange={(e) => handleAmountYChange(e.target.value)}
              className="w-full bg-transparent text-2xl font-medium text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
        </div>

        {estimatedLp !== null && (
          <p className="px-1 text-xs text-white/50">
            You will receive ≈ {formatUnits(estimatedLp, 7)} LP tokens
          </p>
        )}

        {!isConnected ? (
          <Button
            onClick={connect}
            className="h-11 w-full rounded-2xl bg-white text-black hover:bg-white/90"
          >
            Connect Wallet
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!hasAmounts || isSubmitting || insufficientX || insufficientY}
            className="h-11 w-full rounded-2xl bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/50"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
