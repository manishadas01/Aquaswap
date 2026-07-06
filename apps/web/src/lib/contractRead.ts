import { Contract, TransactionBuilder, BASE_FEE, rpc, scValToNative } from '@stellar/stellar-sdk';
import { networkConfig } from '@/lib/config';

/**
 * Read-only simulated contract call — no signing, no submission.
 * `networkConfig.deployer` only needs to exist on-ledger as the source account;
 * it never authorizes or pays for anything real.
 */
export async function simulateRead(
  contractId: string,
  method: string,
  args: any[] = [],
): Promise<any | null> {
  const readerAccount = networkConfig.deployer;
  if (!readerAccount) return null;

  try {
    const server = new rpc.Server(networkConfig.rpcUrl);
    const account = await server.getAccount(readerAccount);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: networkConfig.networkPassphrase,
    })
      .addOperation(new Contract(contractId).call(method, ...args))
      .setTimeout(30)
      .build();
    const sim = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) return null;
    return scValToNative(sim.result.retval);
  } catch {
    return null;
  }
}
