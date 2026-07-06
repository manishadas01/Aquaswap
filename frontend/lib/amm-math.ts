// Client-side constant-product AMM math — exact BigInt mirror of
// contracts/shared/src/math.rs (see sdk/typescript/src/math.ts for the
// canonical TS copy used by the SDK/tests).

const FEE_NUMERATOR = 997n;
const FEE_DENOMINATOR = 1000n;

export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n) throw new Error('InsufficientInputAmount');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('InsufficientLiquidity');

  const amountInWithFee = amountIn * FEE_NUMERATOR;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;

  return numerator / denominator;
}

export function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountOut <= 0n) throw new Error('InsufficientOutputAmount');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('InsufficientLiquidity');
  if (amountOut >= reserveOut) throw new Error('InsufficientReserve');

  const numerator = reserveIn * amountOut * FEE_DENOMINATOR;
  const denominator = (reserveOut - amountOut) * FEE_NUMERATOR;

  return numerator / denominator + 1n;
}

/** Price impact as a fraction 0-1; multiply by 100 for a percentage. */
export function calcPriceImpact(amountIn: bigint, reserveIn: bigint): number {
  if (reserveIn === 0n) return 1;
  return Number(amountIn) / Number(reserveIn + amountIn);
}

/** Proportional deposit quote — no fee, no price impact. */
export function quote(amountA: bigint, reserveA: bigint, reserveB: bigint): bigint {
  if (amountA <= 0n) throw new Error('InsufficientInputAmount');
  if (reserveA <= 0n || reserveB <= 0n) throw new Error('InsufficientLiquidity');
  return (amountA * reserveB) / reserveA;
}

/** Integer square root (floor). */
export function sqrt(y: bigint): bigint {
  if (y < 0n) throw new Error('sqrt of negative');
  if (y === 0n) return 0n;
  if (y < 4n) return 1n;

  let z = y;
  let x = y / 2n + 1n;
  while (x < z) {
    z = x;
    x = (y / x + x) / 2n;
  }
  return z;
}

/** Minimum LP tokens permanently locked on first deposit. */
export const MINIMUM_LIQUIDITY = 1000n;

/** LP tokens minted for the very first deposit into an empty pool. */
export function calcFirstDepositLp(amountX: bigint, amountY: bigint): bigint {
  return sqrt(amountX * amountY) - MINIMUM_LIQUIDITY;
}

/** LP tokens minted for a deposit into a pool that already has liquidity. */
export function calcSubsequentDepositLp(
  amountX: bigint,
  amountY: bigint,
  reserveX: bigint,
  reserveY: bigint,
  totalSupply: bigint,
): bigint {
  const lpX = (amountX * totalSupply) / reserveX;
  const lpY = (amountY * totalSupply) / reserveY;
  return lpX < lpY ? lpX : lpY;
}
