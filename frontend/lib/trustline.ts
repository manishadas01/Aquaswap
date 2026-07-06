import { Asset, Operation, TransactionBuilder, BASE_FEE, rpc } from '@stellar/stellar-sdk';
import { networkConfig, type TokenInfo } from '@/lib/config';
import { signWithWallet } from '@/lib/wallet';
import { waitForTransaction } from '@/lib/txStatus';

const DEFAULT_HORIZON_URL = 'https://horizon-testnet.stellar.org';

/**
 * True if `publicKey` can already hold `token` — always true for native XLM,
 * otherwise checks whether the account has an established trustline for the
 * classic asset backing the token's Stellar Asset Contract.
 */
export async function hasTrustline(publicKey: string, token: TokenInfo): Promise<boolean> {
  if (!token.issuer) return true;

  const horizonUrl = networkConfig.horizonUrl ?? DEFAULT_HORIZON_URL;
  try {
    const res = await fetch(`${horizonUrl}/accounts/${publicKey}`, { cache: 'no-store' });
    if (res.status === 404) return false; // unfunded account has no trustlines at all
    if (!res.ok) throw new Error(`Horizon returned ${res.status}`);
    const data = await res.json();
    return (data.balances ?? []).some(
      (b: any) => b.asset_code === token.symbol && b.asset_issuer === token.issuer,
    );
  } catch {
    return false;
  }
}

/** Builds, signs (via the connected wallet) and submits a change_trust operation for `token`. */
export async function establishTrustline(publicKey: string, token: TokenInfo): Promise<string> {
  if (!token.issuer) {
    throw new Error('Native XLM does not need a trustline');
  }

  const server = new rpc.Server(networkConfig.rpcUrl);
  const account = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkConfig.networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset(token.symbol, token.issuer) }))
    .setTimeout(30)
    .build();

  const signedXdr = await signWithWallet(tx.toXDR(), networkConfig.networkPassphrase, publicKey);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, networkConfig.networkPassphrase);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    throw new Error('Failed to establish trustline');
  }

  // Wait for the trustline to actually land before letting a caller treat it
  // as done — sendTransaction only confirms the network accepted it.
  await waitForTransaction(sendResult.hash);

  return sendResult.hash;
}
