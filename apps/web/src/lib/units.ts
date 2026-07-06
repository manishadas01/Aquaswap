/** Parses a decimal string like "12.5" into base units for a token with `decimals` precision. */
export function parseUnits(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!trimmed) return 0n;

  const [wholeRaw, fracRaw = ''] = trimmed.split('.');
  const whole = wholeRaw.replace(/[^\d]/g, '') || '0';
  const frac = fracRaw.replace(/[^\d]/g, '').slice(0, decimals).padEnd(decimals, '0');

  const digits = `${whole}${frac}`.replace(/^0+(?=\d)/, '');
  return BigInt(digits || '0');
}

/** Formats base units back into a trimmed decimal string, capped to `maxDecimals` fraction digits. */
export function formatUnits(value: bigint, decimals: number, maxDecimals = 6): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = abs % divisor;

  let fracStr = frac.toString().padStart(decimals, '0').slice(0, maxDecimals);
  fracStr = fracStr.replace(/0+$/, '');

  const result = fracStr ? `${whole}.${fracStr}` : `${whole}`;
  return negative ? `-${result}` : result;
}
