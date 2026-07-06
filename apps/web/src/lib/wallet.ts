import {
  isConnected as freighterIsConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';

export interface WalletConnection {
  address: string;
  network: string | null;
}

/** True if the Freighter browser extension is installed and reachable. */
export async function isWalletInstalled(): Promise<boolean> {
  try {
    const res = await freighterIsConnected();
    return !res.error;
  } catch {
    return false;
  }
}

/**
 * Detect the extension, request access (opens Freighter's approval popup),
 * and return the granted address + active network.
 */
export async function connectWallet(): Promise<WalletConnection> {
  if (!(await isWalletInstalled())) {
    throw new Error('Freighter not detected. Install the Freighter extension and refresh.');
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error('Connection rejected in wallet');
  }

  const net = await getNetwork();
  return { address: access.address, network: net.network ?? null };
}

/**
 * Re-hydrate a session on page load without prompting the user —
 * only succeeds if the app was previously granted permission.
 */
export async function getPermittedConnection(): Promise<WalletConnection | null> {
  if (!(await isWalletInstalled())) return null;

  const allowed = await isAllowed();
  if (allowed.error || !allowed.isAllowed) return null;

  const addr = await getAddress();
  if (addr.error || !addr.address) return null;

  const net = await getNetwork();
  return { address: addr.address, network: net.network ?? null };
}

/** Explicitly (re-)request allow-list permission without a full connect flow. */
export async function grantWalletPermission(): Promise<boolean> {
  const res = await setAllowed();
  return !res.error && res.isAllowed;
}

/** Sign a built transaction XDR with Freighter. Never touches the secret key. */
export async function signWithWallet(
  xdr: string,
  networkPassphrase: string,
  address: string,
): Promise<string> {
  const signed = await signTransaction(xdr, { networkPassphrase, address });
  if (signed.error) {
    throw new Error('Transaction rejected in wallet');
  }
  return signed.signedTxXdr;
}
