import { initializeNode, connectToNetwork, ValidatorConfig, createAndStoreKeys, implementStateSync } from './networkConnector';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateConfig } from './configGenerator';

dotenv.config();

async function startNode() {
  try {
    const environment = process.env.NODE_ENVIRONMENT as 'local' | 'testnet' | 'mainnet';
    if (!['local', 'testnet', 'mainnet'].includes(environment)) {
      throw new Error('Invalid NODE_ENVIRONMENT. Please specify local, testnet, or mainnet.');
    }

    const config: ValidatorConfig = await generateConfig(environment);

    // Check if keys already exist
    const keyFile = path.join(config.homeDir, 'config', 'priv_validator_key.json');
    if (!fs.existsSync(keyFile)) {
      logger.info("Keys not found. Generating new keys...");
      await createAndStoreKeys(config);
    } else {
      logger.info("Keys found. Proceeding with initialization...");
    }

    await initializeNode(config);

    logger.info('Implementing state sync...');
    await implementStateSync(config);
    logger.info('State sync implemented and configuration updated');

    const nodeProcess = await connectToNetwork(config);

    // Keep the process running
    process.on('SIGINT', () => {
      logger.info('Stopping the node...');
      if (nodeProcess && nodeProcess.kill) {
        nodeProcess.kill();
      }
      process.exit(0);
    });

  } catch (error) {
    logger.error("Failed to start node:", error);
    process.exit(1);
  }
}

startNode().catch(error => {
  logger.error("Unhandled error in startNode:", error);
  process.exit(1);
});
