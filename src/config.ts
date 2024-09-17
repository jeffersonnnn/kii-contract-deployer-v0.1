import dotenv from 'dotenv';

dotenv.config();

export const networkConfig = {
  local: {
    chainId: 'kiichain-local',
    rpcUrl: 'http://localhost:26657',
    network: 'local' as const,
  },
  testnet: {
    chainId: process.env.TESTNET_CHAIN_ID || '',
    rpcUrl: process.env.TESTNET_RPC_URL || '',
    network: 'testnet' as const,
    seeds: process.env.TESTNET_SEEDS?.split(',') || [],
    persistentPeers: process.env.TESTNET_PERSISTENT_PEERS?.split(',') || [],
    rpcEndpoints: process.env.TESTNET_RPC_ENDPOINTS?.split(',') || [],
  },
  mainnet: {
    chainId: process.env.MAINNET_CHAIN_ID || '',
    rpcUrl: process.env.MAINNET_RPC_URL || '',
    network: 'mainnet' as const,
    seeds: process.env.MAINNET_SEEDS?.split(',') || [],
    persistentPeers: process.env.MAINNET_PERSISTENT_PEERS?.split(',') || [],
    rpcEndpoints: process.env.MAINNET_RPC_ENDPOINTS?.split(',') || [],
  },
};

export const getChainId = (network: 'testnet' | 'mainnet'): string => {
  const chainId = networkConfig[network].chainId;
  if (!chainId) {
    throw new Error(`Chain ID for ${network} is not set.`);
  }
  return chainId;
};