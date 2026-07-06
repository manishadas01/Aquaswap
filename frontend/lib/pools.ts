import { Address } from '@stellar/stellar-sdk';
import { INDEXER_URL, tokenList, type TokenInfo } from '@/lib/config';
import { simulateRead } from '@/lib/contractRead';

interface PairRow {
  id: string;
  token_x: string;
  token_y: string;
  reserve_x: string | null;
  reserve_y: string | null;
}

export interface PoolInfo {
  address: string;
  tokenX: TokenInfo;
  tokenY: TokenInfo;
  reserveX: bigint;
  reserveY: bigint;
}

function tokenBySac(sac: string): TokenInfo | undefined {
  return tokenList.find((t) => t.sac === sac);
}

/** Lists every indexed pool whose tokens we recognize, with live reserves. */
export async function fetchPools(): Promise<PoolInfo[]> {
  const res = await fetch(`${INDEXER_URL}/pairs`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Indexer returned ${res.status}`);
  const data = await res.json();
  const rows: PairRow[] = data.pairs ?? [];

  const pools: PoolInfo[] = [];
  for (const row of rows) {
    const tokenX = tokenBySac(row.token_x);
    const tokenY = tokenBySac(row.token_y);
    if (!tokenX || !tokenY) continue; // skip pairs using tokens outside our known list (e.g. deprecated real-USDC pair)

    pools.push({
      address: row.id,
      tokenX,
      tokenY,
      reserveX: row.reserve_x ? BigInt(row.reserve_x) : 0n,
      reserveY: row.reserve_y ? BigInt(row.reserve_y) : 0n,
    });
  }
  return pools;
}

/** LP token balance for `account` in a given pool, read directly on-chain. */
export async function getLpBalance(pairAddress: string, account: string): Promise<bigint> {
  const balance = await simulateRead(pairAddress, 'lp_balance', [new Address(account).toScVal()]);
  return balance ?? 0n;
}

/** Total LP supply for a pool, read directly on-chain. */
export async function getLpTotalSupply(pairAddress: string): Promise<bigint> {
  const supply = await simulateRead(pairAddress, 'lp_total_supply');
  return supply ?? 0n;
}
