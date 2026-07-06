'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PoolCard } from '@/components/pool/PoolCard';
import { fetchPools, type PoolInfo } from '@/lib/pools';

export function PoolsList() {
  const [pools, setPools] = useState<PoolInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchPools()
      .then(setPools)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load pools'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <p className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-400/80">
        {error} — the indexer may be unreachable.
      </p>
    );
  }

  if (!pools) {
    return (
      <div className="flex items-center gap-2 py-10 text-white/50">
        <Loader2 className="size-4 animate-spin" />
        Loading pools…
      </div>
    );
  }

  if (pools.length === 0) {
    return <p className="text-sm text-white/50">No pools indexed yet.</p>;
  }

  return (
    <div className="space-y-3">
      {pools.map((pool) => (
        <PoolCard key={pool.address} pool={pool} onChanged={load} />
      ))}
    </div>
  );
}
