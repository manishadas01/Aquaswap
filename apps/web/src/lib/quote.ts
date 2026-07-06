import { Address } from '@stellar/stellar-sdk';
import { getAmountOut, calcPriceImpact } from '@/lib/amm-math';
import { INDEXER_URL, networkConfig } from '@/lib/config';
import { simulateRead } from '@/lib/contractRead';

interface PairRow {
  id: string;
  address: string;
  token_x: string;
  token_y: string;
  reserve_x: string | null;
  reserve_y: string | null;
}

export interface Quote {
  amountOut: bigint;
  priceImpact: number;
  reserveIn: bigint;
  reserveOut: bigint;
}

async function fetchPairs(): Promise<PairRow[]> {
  const res = await fetch(`${INDEXER_URL}/pairs`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Indexer returned ${res.status}`);
  const data = await res.json();
  return data.pairs ?? [];
}

function findPair(pairs: PairRow[], tokenInSac: string, tokenOutSac: string) {
  return pairs.find(
    (p) =>
      (p.token_x === tokenInSac && p.token_y === tokenOutSac) ||
      (p.token_x === tokenOutSac && p.token_y === tokenInSac),
  );
}

/**
 * Reads reserves straight from the Pair contract via a read-only simulated call.
 * Used when the indexer is unreachable or lagging — `networkConfig.deployer` only
 * needs to exist on-ledger; it never signs or submits anything.
 */
async function getOnChainReserves(
  tokenInSac: string,
  tokenOutSac: string,
): Promise<{ reserveIn: bigint; reserveOut: bigint } | null> {
  const factoryId = networkConfig.contracts.factory;
  if (!factoryId) return null;

  const pairAddress: string | null = await simulateRead(factoryId, 'get_pair', [
    new Address(tokenInSac).toScVal(),
    new Address(tokenOutSac).toScVal(),
  ]);
  if (!pairAddress) return null;

  const tokenX: string | null = await simulateRead(pairAddress, 'token_x');
  const reserves: [bigint, bigint] | null = await simulateRead(pairAddress, 'get_reserves');
  if (!tokenX || !reserves) return null;

  const [reserveX, reserveY] = reserves;
  return tokenX === tokenInSac
    ? { reserveIn: reserveX, reserveOut: reserveY }
    : { reserveIn: reserveY, reserveOut: reserveX };
}

/**
 * Computes an exact-input quote from live reserves — indexer first, falling back
 * to a direct on-chain read if the indexer is down or hasn't caught up yet.
 * Throws only if neither source has a pool for this pair — callers should catch
 * that and fall back to a "not available" UI state.
 */
export async function getQuote(
  tokenInSac: string,
  tokenOutSac: string,
  amountIn: bigint,
): Promise<Quote> {
  let reserveIn: bigint | undefined;
  let reserveOut: bigint | undefined;

  try {
    const pairs = await fetchPairs();
    const pair = findPair(pairs, tokenInSac, tokenOutSac);
    if (pair?.reserve_x && pair?.reserve_y) {
      [reserveIn, reserveOut] =
        pair.token_x === tokenInSac
          ? [BigInt(pair.reserve_x), BigInt(pair.reserve_y)]
          : [BigInt(pair.reserve_y), BigInt(pair.reserve_x)];
    }
  } catch {
    // indexer unreachable — fall through to on-chain read
  }

  if (reserveIn === undefined || reserveOut === undefined) {
    const onChain = await getOnChainReserves(tokenInSac, tokenOutSac);
    if (!onChain) throw new Error('No liquidity pool found for this pair yet');
    ({ reserveIn, reserveOut } = onChain);
  }

  const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
  const priceImpact = calcPriceImpact(amountIn, reserveIn);

  return { amountOut, priceImpact, reserveIn, reserveOut };
}
