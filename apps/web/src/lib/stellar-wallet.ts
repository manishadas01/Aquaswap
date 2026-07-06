import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction
} from '@stellar/freighter-api';

export const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';

export async function detectFreighter(): Promise<boolean> {
  const result = await isConnected();
  // @ts-ignore - Handle both v4 and v6 returns
  return typeof result === 'boolean' ? result : result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const allowedResult = await isAllowed();
  // @ts-ignore - Handle both v4 and v6 returns
  const allowed = typeof allowedResult === 'boolean' ? allowedResult : allowedResult.isAllowed;
  
  if (!allowed) {
    await requestAccess();
  }
  const { address, error } = await getAddress();
  if (error) {
    throw new Error(error);
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  const allowedResult = await isAllowed();
  // @ts-ignore - Handle both v4 and v6 returns
  const allowed = typeof allowedResult === 'boolean' ? allowedResult : allowedResult.isAllowed;
  
  if (allowed) {
    const { address, error } = await getAddress();
    if (!error && address) {
      return address;
    }
  }
  return null;
}

export async function signTx(xdr: string): Promise<string> {
  const { signedTxXdr, error } = await signTransaction(xdr, {
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE
  });
  if (error) {
    throw new Error(error);
  }
  return signedTxXdr;
}
