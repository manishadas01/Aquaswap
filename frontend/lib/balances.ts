import { networkConfig, type TokenInfo } from '@/lib/config';
import { parseUnits } from '@/lib/units';

const DEFAULT_HORIZON_URL = 'https://horizon-testnet.stellar.org';

/** The account's spendable balance for `token`, in base units. 0n if unfunded or no trustline. */
export async function getTokenBalance(publicKey: string, token: TokenInfo): Promise<bigint> {
  const horizonUrl = networkConfig.horizonUrl ?? DEFAULT_HORIZON_URL;
  try {
    const res = await fetch(`${horizonUrl}/accounts/${publicKey}`, { cache: 'no-store' });
    if (res.status === 404) return 0n;
    if (!res.ok) throw new Error(`Horizon returned ${res.status}`);
    const data = await res.json();
    const balances: any[] = data.balances ?? [];

    const entry = token.issuer
      ? balances.find((b) => b.asset_code === token.symbol && b.asset_issuer === token.issuer)
      : balances.find((b) => b.asset_type === 'native');

    return entry ? parseUnits(entry.balance, token.decimals) : 0n;
  } catch {
    return 0n;
  }
}
