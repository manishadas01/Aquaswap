import testnetConfig from '@/config/testnet.json';
import localConfig from '@/config/local.json';

export interface TokenInfo {
  sac: string;
  asset: string;
  symbol: string;
  name: string;
  decimals: number;
  issuer: string | null;
}

export interface AppNetworkConfig {
  network: string;
  rpcUrl: string;
  networkPassphrase: string;
  horizonUrl?: string;
  /** A funded G-address used only as the source account for read-only simulated calls. */
  deployer?: string | null;
  contracts: {
    factory: string | null;
    router: string | null;
    pairWasmHash: string | null;
  };
  tokens: Record<string, TokenInfo>;
}

const CONFIGS: Record<string, AppNetworkConfig> = {
  testnet: testnetConfig as AppNetworkConfig,
  local: {
    ...(localConfig as unknown as AppNetworkConfig),
    tokens: {},
  },
};

export const ACTIVE_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet').toLowerCase();

export const networkConfig: AppNetworkConfig = CONFIGS[ACTIVE_NETWORK] ?? CONFIGS.testnet;

export const tokenList: TokenInfo[] = Object.values(networkConfig.tokens ?? {});

/** True once the factory + router have real deployed addresses (config/*.json is no longer null). */
export const contractsDeployed = !!networkConfig.contracts?.factory && !!networkConfig.contracts?.router;

export const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? 'http://localhost:4000';
