import { initializeNode, connectToNetwork, createValidator, ValidatorConfig, implementStateSync } from './networkConnector';
import { generateConfig } from './configGenerator';
import { logger } from './logger';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    const environment = process.env.NODE_ENVIRONMENT as 'local' | 'testnet' | 'mainnet';
    if (!['local', 'testnet', 'mainnet'].includes(environment)) {
      throw new Error('Invalid NODE_ENVIRONMENT. Please specify local, testnet, or mainnet.');
    }

    // Generate the configuration
    const config: ValidatorConfig = await generateConfig(environment);

    // Initialize the node
    await initializeNode(config);

    // Implement state sync (if not local environment)
    if (environment !== 'local') {
      logger.info('Implementing state sync...');
      await implementStateSync(config);
      logger.info('State sync implemented and configuration updated');
    }

    // Connect to the network
    const nodeProcess = await connectToNetwork(config);

    // Keep the process running
    process.on('SIGINT', () => {
      logger.info('Stopping the node...');
      if (nodeProcess && nodeProcess.kill) {
        nodeProcess.kill();
      }
      process.exit(0);
    });

    // Optionally, create a validator
    // Uncomment the following line when you're ready to create a validator
    // await createValidator(config);

    logger.info(`Node is running in ${environment} environment.`);
    logger.info('Use Ctrl+C to stop the node.');

  } catch (error) {
    logger.error('Error running node:', error);
    process.exit(1);
  }
}

run().catch(error => {
  logger.error("Unhandled error in runNode:", error);
  process.exit(1);
});