import dotenv from 'dotenv';
import { ValidatorConfig } from './networkConnector';
import { networkConfig } from './config';

dotenv.config();

export async function generateConfig(environment: 'local' | 'testnet' | 'mainnet'): Promise<ValidatorConfig> {
  const baseConfig: Partial<ValidatorConfig> = {
    moniker: process.env.VALIDATOR_MONIKER,
    keyName: process.env.VALIDATOR_KEY_NAME,
    identity: process.env.VALIDATOR_IDENTITY,
    website: process.env.VALIDATOR_WEBSITE,
    securityContact: process.env.VALIDATOR_SECURITY_CONTACT,
    details: process.env.VALIDATOR_DETAILS,
    commissionRate: process.env.VALIDATOR_COMMISSION_RATE,
    commissionMaxRate: process.env.VALIDATOR_COMMISSION_MAX_RATE,
    commissionMaxChangeRate: process.env.VALIDATOR_COMMISSION_MAX_CHANGE_RATE,
    minSelfDelegation: process.env.VALIDATOR_MIN_SELF_DELEGATION,
    homeDir: process.env.VALIDATOR_HOME_DIR,
    mnemonic: process.env.VALIDATOR_MNEMONIC,
  };

  const envConfig = networkConfig[environment];

  if (!envConfig) {
    throw new Error(`Invalid environment: ${environment}`);
  }

  const config: ValidatorConfig = {
    ...baseConfig,
    ...envConfig,
    environment,
  } as ValidatorConfig;

  return config;
}