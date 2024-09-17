import { deployValidator, ValidatorConfig } from './networkConnector';
import { generateConfig } from './configGenerator';
import { logger } from './logger';

export async function main() {
  try {
    const environment = process.argv[2] as 'local' | 'testnet' | 'mainnet';
    if (!['local', 'testnet', 'mainnet'].includes(environment)) {
      throw new Error('Invalid environment. Please specify local, testnet, or mainnet.');
    }

    const config: ValidatorConfig = await generateConfig(environment);
    await deployValidator(config);

  } catch (error) {
    logger.error('Error deploying validator:', error);
    process.exit(1);
  }
}