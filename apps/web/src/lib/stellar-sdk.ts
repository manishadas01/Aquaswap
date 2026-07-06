import * as StellarSdk from '@stellar/stellar-sdk';
import { STELLAR_TESTNET_PASSPHRASE, HORIZON_TESTNET_URL } from './stellar-wallet';

const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL);

export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const account = await server.accounts().accountId(address).call();
    const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
    return nativeBalance ? nativeBalance.balance : '0.0000000';
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return '0';
    }
    throw error;
  }
}

export async function buildPaymentXdr(from: string, to: string, amount: string): Promise<string> {
  const account = await server.loadAccount(from);
  const fee = await server.fetchBaseFee();
  
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: to,
        asset: StellarSdk.Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

export async function submitSignedTx(signedXdr: string): Promise<{ hash: string }> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, STELLAR_TESTNET_PASSPHRASE);
  const response = await server.submitTransaction(tx);
  return { hash: response.hash };
}
