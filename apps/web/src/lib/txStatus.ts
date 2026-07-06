import { networkConfig } from '@/lib/config';

const DEFAULT_HORIZON_URL = 'https://horizon-testnet.stellar.org';

/**
 * Polls Horizon until a submitted transaction is actually applied on-ledger.
 * `sendTransaction` only confirms the network *accepted* the envelope (status
 * PENDING) — it says nothing about whether it landed. Without this, a caller
 * that treats "submitted" as "done" can race a dependent follow-up action
 * (e.g. swapping right after adding a trustline) against a transaction that
 * hasn't actually applied yet.
 *
 * Deliberately uses Horizon's REST API rather than Soroban RPC's
 * `getTransaction` — the installed `@stellar/stellar-sdk` version fails to
 * parse the transaction-meta XDR for this network ("Bad union switch: 4"),
 * for both classic and Soroban transactions. Horizon's plain JSON response
 * sidesteps that entirely.
 */
export async function waitForTransaction(
  hash: string,
  { timeoutMs = 30_000, intervalMs = 1500 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const horizonUrl = networkConfig.horizonUrl ?? DEFAULT_HORIZON_URL;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${horizonUrl}/transactions/${hash}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.successful) return;
      throw new Error('Transaction failed on-chain');
    }
    if (res.status !== 404) {
      throw new Error(`Horizon returned ${res.status} while confirming transaction`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Timed out waiting for transaction confirmation');
}
