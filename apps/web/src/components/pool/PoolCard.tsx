'use client';

import { useEffect, useState } from 'react';
import { TokenIcon } from '@/components/TokenIcon';
import { AddLiquidityDialog } from '@/components/pool/AddLiquidityDialog';
import { RemoveLiquidityDialog } from '@/components/pool/RemoveLiquidityDialog';
import { useWallet } from '@/context/WalletContext';
import type { PoolInfo } from '@/lib/pools';
import { getLpBalance, getLpTotalSupply } from '@/lib/pools';
import { formatUnits } from '@/lib/units';

interface PoolCardProps {
  pool: PoolInfo;
  onChanged?: () => void;
}

export function PoolCard({ pool, onChanged }: PoolCardProps) {
  const { publicKey, isConnected } = useWallet();
  const [lpBalance, setLpBalance] = useState<bigint | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLpTotalSupply(pool.address).then((v) => !cancelled && setTotalSupply(v));
    if (publicKey) {
      getLpBalance(pool.address, publicKey).then((v) => !cancelled && setLpBalance(v));
    } else {
      setLpBalance(null);
    }
    return () => {
      cancelled = true;
    };
  }, [pool.address, publicKey]);

  const hasLiquidity = pool.reserveX > 0n && pool.reserveY > 0n;
  const sharePct =
    lpBalance && totalSupply && totalSupply > 0n
      ? (Number(lpBalance) / Number(totalSupply)) * 100
      : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <TokenIcon symbol={pool.tokenX.symbol} className="size-8 border-2 border-[#150f13] text-xs" />
            <TokenIcon symbol={pool.tokenY.symbol} className="size-8 border-2 border-[#150f13] text-xs" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {pool.tokenX.symbol} / {pool.tokenY.symbol}
            </p>
            {!hasLiquidity && <p className="text-xs text-amber-400/80">No liquidity yet</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AddLiquidityDialog pool={pool} onSuccess={onChanged} />
          {isConnected && !!lpBalance && lpBalance > 0n && (
            <RemoveLiquidityDialog pool={pool} onSuccess={onChanged} />
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-white/40">Reserve {pool.tokenX.symbol}</p>
          <p className="text-white/90">{formatUnits(pool.reserveX, pool.tokenX.decimals)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Reserve {pool.tokenY.symbol}</p>
          <p className="text-white/90">{formatUnits(pool.reserveY, pool.tokenY.decimals)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Total LP supply</p>
          <p className="text-white/90">{totalSupply !== null ? formatUnits(totalSupply, 7) : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Your share</p>
          <p className="text-white/90">
            {isConnected ? (lpBalance ? `${sharePct.toFixed(4)}%` : '0%') : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
