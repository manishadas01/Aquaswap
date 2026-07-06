import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';
import { networkConfig } from '@/lib/config';
import { signWithWallet } from '@/lib/wallet';
import { waitForTransaction } from '@/lib/txStatus';

function getServer() {
  return new rpc.Server(networkConfig.rpcUrl);
}

function requireRouter(): string {
  const routerId = networkConfig.contracts.router;
  if (!routerId) {
    throw new Error('Router contract is not deployed on this network yet');
  }
  return routerId;
}

/**
 * Builds, simulates, signs (via the connected wallet) and submits a single
 * Router contract call. Returns the submitted tx hash plus the simulated
 * return value (decoded), which reflects the real amounts the call will
 * produce since simulation runs against live ledger state.
 */
async function buildSimSignSubmit(
  contractId: string,
  method: string,
  args: any[],
  publicKey: string,
): Promise<{ hash: string; result: any }> {
  const server = getServer();
  const account = await server.getAccount(publicKey);
  const op = new Contract(contractId).call(method, ...args);

  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkConfig.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(built);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const result = sim.result ? scValToNative(sim.result.retval) : undefined;

  const prepared = rpc.assembleTransaction(built, sim).build();
  const signedXdr = await signWithWallet(
    prepared.toXDR(),
    networkConfig.networkPassphrase,
    publicKey,
  );

  const signedTx = TransactionBuilder.fromXDR(signedXdr, networkConfig.networkPassphrase);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    throw new Error('Transaction submission failed');
  }

  // Wait for real confirmation — sendTransaction only means the network
  // accepted the envelope, not that it has actually applied yet.
  await waitForTransaction(sendResult.hash);

  return { hash: sendResult.hash, result };
}

export interface SwapExactInParams {
  publicKey: string;
  amountIn: bigint;
  amountOutMin: bigint;
  /** Token SAC/contract addresses, from the input token to the output token. */
  path: string[];
  /** Unix timestamp (seconds) after which the swap reverts. */
  deadline: number;
}

/** Builds, simulates, signs and submits a `swap_exact_tokens_for_tokens` call. */
export async function swapExactTokensForTokens(params: SwapExactInParams): Promise<string> {
  const routerId = requireRouter();
  const { hash } = await buildSimSignSubmit(
    routerId,
    'swap_exact_tokens_for_tokens',
    [
      new Address(params.publicKey).toScVal(),
      nativeToScVal(params.amountIn, { type: 'i128' }),
      nativeToScVal(params.amountOutMin, { type: 'i128' }),
      nativeToScVal(params.path.map((t) => new Address(t).toScVal())),
      new Address(params.publicKey).toScVal(),
      nativeToScVal(BigInt(params.deadline), { type: 'u64' }),
    ],
    params.publicKey,
  );
  return hash;
}

export interface AddLiquidityParams {
  publicKey: string;
  tokenA: string;
  tokenB: string;
  amountADesired: bigint;
  amountBDesired: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  deadline: number;
}

export interface AddLiquidityResult {
  hash: string;
  amountA: bigint;
  amountB: bigint;
  lpMinted: bigint;
}

/** Builds, simulates, signs and submits an `add_liquidity` call. */
export async function addLiquidity(params: AddLiquidityParams): Promise<AddLiquidityResult> {
  const routerId = requireRouter();
  const { hash, result } = await buildSimSignSubmit(
    routerId,
    'add_liquidity',
    [
      new Address(params.publicKey).toScVal(),
      new Address(params.tokenA).toScVal(),
      new Address(params.tokenB).toScVal(),
      nativeToScVal(params.amountADesired, { type: 'i128' }),
      nativeToScVal(params.amountBDesired, { type: 'i128' }),
      nativeToScVal(params.amountAMin, { type: 'i128' }),
      nativeToScVal(params.amountBMin, { type: 'i128' }),
      new Address(params.publicKey).toScVal(),
      nativeToScVal(BigInt(params.deadline), { type: 'u64' }),
    ],
    params.publicKey,
  );
  const [amountA, amountB, lpMinted] = (result ?? [0n, 0n, 0n]) as [bigint, bigint, bigint];
  return { hash, amountA, amountB, lpMinted };
}

export interface RemoveLiquidityParams {
  publicKey: string;
  tokenA: string;
  tokenB: string;
  liquidity: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  deadline: number;
}

export interface RemoveLiquidityResult {
  hash: string;
  amountA: bigint;
  amountB: bigint;
}

/** Builds, simulates, signs and submits a `remove_liquidity` call. */
export async function removeLiquidity(params: RemoveLiquidityParams): Promise<RemoveLiquidityResult> {
  const routerId = requireRouter();
  const { hash, result } = await buildSimSignSubmit(
    routerId,
    'remove_liquidity',
    [
      new Address(params.publicKey).toScVal(),
      new Address(params.tokenA).toScVal(),
      new Address(params.tokenB).toScVal(),
      nativeToScVal(params.liquidity, { type: 'i128' }),
      nativeToScVal(params.amountAMin, { type: 'i128' }),
      nativeToScVal(params.amountBMin, { type: 'i128' }),
      new Address(params.publicKey).toScVal(),
      nativeToScVal(BigInt(params.deadline), { type: 'u64' }),
    ],
    params.publicKey,
  );
  const [amountA, amountB] = (result ?? [0n, 0n]) as [bigint, bigint];
  return { hash, amountA, amountB };
}
