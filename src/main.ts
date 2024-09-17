import dotenv from 'dotenv';
import { 
  initializeNode, 
  connectToNetwork, 
  createAndStoreKeys, 
  createValidatorJson, 
  createValidator, 
  checkNodeSync, 
  exportPrivateKey,
  implementStateSync,
  ValidatorConfig,
  deployValidator
} from './networkConnector';
import { logger } from './logger';
import readline from 'readline';
import { generateConfig } from './configGenerator';

dotenv.config();

function validateEnvironmentVariables() {
  const requiredVars = [
    'VALIDATOR_MONIKER',
    'VALIDATOR_KEY_NAME',
    'VALIDATOR_HOME_DIR',
    'VALIDATOR_MNEMONIC',
    'TESTNET_BLOCK_EXPLORER',
    'MAINNET_BLOCK_EXPLORER',
    'TESTNET_GENESIS_URL',
    'MAINNET_GENESIS_URL'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Environment variable ${varName} is not set.`);
    }
  }
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    validateEnvironmentVariables();

    const environment = process.argv[2] as 'local' | 'testnet' | 'mainnet';
    if (!['local', 'testnet', 'mainnet'].includes(environment)) {
      throw new Error('Invalid environment. Please specify local, testnet, or mainnet.');
    }

    const config: ValidatorConfig = await generateConfig(environment);

    await deployValidator(config);

    const blockExplorer = environment === 'mainnet' 
      ? process.env.MAINNET_BLOCK_EXPLORER 
      : process.env.TESTNET_BLOCK_EXPLORER;

    logger.info(`Use the Kii Block Explorer Dashboard at ${blockExplorer} to delegate and manage your validator.`);

  } catch (error) {
    logger.error('Error deploying validator:', error);
    process.exit(1);
  }
}

main();