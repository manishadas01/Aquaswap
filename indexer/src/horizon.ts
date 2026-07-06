import { rpc, scValToNative, Contract, TransactionBuilder, BASE_FEE } from '@stellar/stellar-sdk';
import { getLastIndexedLedger, setLastIndexedLedger, insertPairSnapshot } from './db/schema';
import { processSwapEvent } from './processors/swap';
import { processLiquidityAdded, processLiquidityRemoved } from './processors/liquidity';
import { processPairCreated } from './processors/pair';

/**
 * Subscribe to Soroban contract events from Horizon.
 * Processes swap, liquidity_added, liquidity_removed, pair_created events.
 *
 * Uses getEvents polling (Horizon SSE is not available for Soroban events directly).
 * In production, switch to Horizon SSE /soroban/events stream.
 */
export async function startIndexer(
  rpcUrl: string,
  networkPassphrase: string,
  readerAccount: string,
  factoryAddress: string,
  pairAddresses: string[],
): Promise<void> {
  const server = new rpc.Server(rpcUrl);
  let lastLedger = await getLastIndexedLedger();

  console.log(`[indexer] starting from ledger ${lastLedger}`);

  // Poll every 5 seconds for new events
  const POLL_INTERVAL = 5_000;
  const PAGE_SIZE = 200;

  const allContracts = [factoryAddress, ...pairAddresses];

  // Reserve-affecting events (swap/liquidity) don't carry the resulting reserves,
  // so after processing one we read the pair's live get_reserves() and snapshot it.
  // `readerAccount` only needs to exist on-ledger — this is a read-only simulated call.
  async function snapshotReserves(pairId: string, ledger: number, ts: number): Promise<void> {
    try {
      const account = await server.getAccount(readerAccount);
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(new Contract(pairId).call('get_reserves'))
        .setTimeout(30)
        .build();
      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        const [reserveX, reserveY] = scValToNative(sim.result.retval) as [bigint, bigint];
        await insertPairSnapshot(pairId, reserveX, reserveY, ledger, ts);
      }
    } catch (err) {
      console.error(`[indexer] failed to snapshot reserves for ${pairId}:`, (err as Error).message);
    }
  }

  const tick = async () => {
    try {
      const events = await server.getEvents({
        startLedger: lastLedger + 1,
        filters: [
          {
            type: 'contract',
            contractIds: allContracts,
          },
        ],
        limit: PAGE_SIZE,
      });

      for (const event of events.events) {
        await processEvent(event, snapshotReserves);
        if (event.ledger > lastLedger) {
          lastLedger = event.ledger;
        }
      }

      if (events.events.length > 0) {
        await setLastIndexedLedger(lastLedger);
        console.log(`[indexer] processed ${events.events.length} events, ledger=${lastLedger}`);
      }
    } catch (err) {
      console.error('[indexer] poll error:', (err as Error).message);
    }
  };

  // Initial tick then schedule
  await tick();
  setInterval(tick, POLL_INTERVAL);
}

type SnapshotFn = (pairId: string, ledger: number, ts: number) => Promise<void>;

async function processEvent(event: any, snapshotReserves: SnapshotFn): Promise<void> {
  const topics: unknown[] = event.topic?.map((t: any) => scValToNative(t)) ?? [];
  const eventName = topics[0] as string;
  const contractId = (topics[1] as string) ?? event.contractId?.toString();
  const ledger: number = event.ledger;
  const ts = Math.floor(new Date(event.ledgerClosedAt).getTime() / 1000) || 0;
  const eventId = `${event.ledger}:${event.id}`;

  // Contract events publish a single #[contracttype] struct, which decodes to a
  // plain JS object keyed by the Rust field names (see contracts/{pair,factory}/src/events.rs).
  const data = scValToNative(event.value) ?? {};

  try {
    switch (eventName) {
      case 'swap':
        await processSwapEvent(eventId, contractId, parseSwapData(data), ledger, ts);
        await snapshotReserves(contractId, ledger, ts);
        break;
      case 'liquidity_added':
        await processLiquidityAdded(eventId, contractId, parseLiqAddedData(data), ledger, ts);
        await snapshotReserves(contractId, ledger, ts);
        break;
      case 'liquidity_removed':
        await processLiquidityRemoved(eventId, contractId, parseLiqRemovedData(data), ledger, ts);
        await snapshotReserves(contractId, ledger, ts);
        break;
      case 'pair_created': {
        // Emitted by the Factory, not the pair — the new pair's address is in the data, not the topics.
        const parsed = parsePairCreatedData(data);
        await processPairCreated(parsed.pair, parsed, ledger, ts);
        break;
      }
      default:
        // Ignore unknown events (sync, etc.)
        break;
    }
  } catch (err) {
    console.error(`[indexer] failed to process event ${eventId}:`, (err as Error).message);
  }
}

// ── Data parsers ──────────────────────────────────────────────────────────────
// `data` is the JS object produced by scValToNative() for the contract's
// #[contracttype] event struct — keyed by the exact Rust field names.

function parseSwapData(data: any) {
  return {
    from: data.from?.toString() ?? '',
    amount_in: data.amount_in?.toString() ?? '0',
    amount_out: data.amount_out?.toString() ?? '0',
    token_in: data.token_in?.toString() ?? '',
    token_out: data.token_out?.toString() ?? '',
  };
}

function parseLiqAddedData(data: any) {
  return {
    provider: data.provider?.toString() ?? '',
    amount_x: data.amount_x?.toString() ?? '0',
    amount_y: data.amount_y?.toString() ?? '0',
    lp_minted: data.lp_minted?.toString() ?? '0',
  };
}

function parseLiqRemovedData(data: any) {
  return {
    provider: data.provider?.toString() ?? '',
    amount_x: data.amount_x?.toString() ?? '0',
    amount_y: data.amount_y?.toString() ?? '0',
    lp_burned: data.lp_burned?.toString() ?? '0',
  };
}

function parsePairCreatedData(data: any) {
  return {
    token_x: data.token_x?.toString() ?? '',
    token_y: data.token_y?.toString() ?? '',
    pair: data.pair?.toString() ?? '',
    pair_index: Number(data.pair_index ?? 0),
  };
}
