export interface ValidatorConfig {
  chainId: string;
  homeDir: string;
  moniker: string;
  keyName: string;
  network: 'testnet' | 'mainnet';
  rpcUrl: string;
  mnemonic?: string;
  commissionRate: string;
  commissionMaxRate: string;
  commissionMaxChangeRate: string;
  minSelfDelegation: string;
  website?: string;
  identity?: string;
  securityContact?: string;
  details?: string;
  selfDelegation?: string;
  denom?: string;
  gasPrice?: string;
  seeds?: string;
  
}