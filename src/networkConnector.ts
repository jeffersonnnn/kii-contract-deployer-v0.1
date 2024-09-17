import { spawn, ChildProcess, exec, execSync } from 'child_process';
import { logger } from './logger';
import fs from 'fs';
import axios from 'axios';
import { networkConfig } from './config';
import dotenv from 'dotenv';

dotenv.config();

export interface ValidatorConfig {
  moniker: string;
  keyName: string;
  identity?: string;
  website?: string;
  securityContact?: string;
  details?: string;
  commissionRate: string;
  commissionMaxRate: string;
  commissionMaxChangeRate: string;
  minSelfDelegation: string;
  rpcUrl: string;
  chainId: string;
  homeDir: string;
  environment: 'local' | 'testnet' | 'mainnet';
  mnemonic?: string;
}

export async function initializeNode(config: ValidatorConfig): Promise<void> {
  logger.info(`Initializing node for ${config.environment}...`);
  try {
    execSync(`kiichaind init "${config.moniker}" --chain-id ${config.chainId} --home "${config.homeDir}" -o`);

    const genesisPath = `${config.homeDir}/config/genesis.json`;

    if (config.environment === 'local') {
      logger.info('Using locally generated genesis file...');
    } else {
      const genesisUrl = config.environment === 'testnet'
        ? process.env.TESTNET_GENESIS_URL
        : process.env.MAINNET_GENESIS_URL;

      if (!genesisUrl) {
        throw new Error(`Genesis URL for ${config.environment} is not set.`);
      }

      logger.info(`Downloading ${config.environment} genesis file...`);
      const response = await axios.get(genesisUrl);

      const genesisData = JSON.parse(JSON.stringify(response.data, (key, value) => {
        if (typeof value === 'number') return value.toString();
        return value;
      }));

      fs.writeFileSync(genesisPath, JSON.stringify(genesisData, null, 2));
    }

    logger.info(`Node initialized successfully for ${config.environment}`);
  } catch (error) {
    logger.error('Error initializing node:', error);
    throw error;
  }
}

export async function connectToNetwork(config: ValidatorConfig): Promise<ChildProcess> {
  logger.info('Connecting to network...');

  return new Promise((resolve, reject) => {
    const nodeProcess = spawn('kiichaind', ['start', '--home', config.homeDir], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let buffer = '';
    const maxBufferSize = 1024 * 1024; // 1MB buffer

    nodeProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      if (buffer.length > maxBufferSize) {
        buffer = buffer.slice(-maxBufferSize);
      }
      logger.info(`Node output: ${data}`);
    });

    nodeProcess.stderr.on('data', (data) => {
      const errorMessage = data.toString();
      logger.error(`Node error: ${errorMessage}`);

      if (errorMessage.includes('invalid validator address')) {
        logger.warn('Validator address mismatch detected. This may be due to an outdated genesis file or incorrect configuration.');
      } else if (errorMessage.includes('state sync')) {
        logger.warn('State sync error detected. Attempting to reinitialize state sync...');
        implementStateSync(config).catch(error => logger.error('Failed to reinitialize state sync:', error));
      }
    });

    nodeProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Node process exited with code ${code}`);
        reject(new Error(`Node process exited with code ${code}`));
      } else {
        resolve(nodeProcess);
      }
    });

    nodeProcess.on('error', (error) => {
      logger.error('Failed to start node process:', error);
      reject(error);
    });

    const checkInterval = setInterval(() => {
      if (buffer.includes('executed block')) {
        clearInterval(checkInterval);
        logger.info('Node started successfully');
        resolve(nodeProcess);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(checkInterval);
      nodeProcess.kill();
      reject(new Error('Node startup timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}

export async function checkNodeSync(config: ValidatorConfig): Promise<boolean> {
  try {
    const statusOutput = execSync(`kiichaind status --node ${config.rpcUrl}`, { encoding: 'utf-8' });
    const statusJson = JSON.parse(statusOutput);

    const catchingUp = statusJson.SyncInfo.catching_up;
    return !catchingUp;
  } catch (error) {
    logger.error('Error checking node sync status:', error);
    return false;
  }
}

export async function exportPrivateKey(config: ValidatorConfig): Promise<string> {
  try {
    const privateKeyOutput = execSync(
      `kiichaind keys export ${config.keyName} --unarmored-hex --unsafe --keyring-backend test --home ${config.homeDir}`,
      { encoding: 'utf-8' }
    );
    return privateKeyOutput.trim();
  } catch (error) {
    logger.error('Error exporting private key:', error);
    throw error;
  }
}

export async function createAndStoreKeys(config: ValidatorConfig): Promise<void> {
  logger.info('Creating and storing keys...');
  try {
    let output: string;
    if (config.mnemonic) {
      const command = `echo "${config.mnemonic}" | kiichaind keys add ${config.keyName} --recover --keyring-backend test --home ${config.homeDir}`;
      output = execSync(`/bin/sh -c "${command}"`, { encoding: 'utf-8'});
    } else {
      const command = `kiichaind keys add ${config.keyName} --keyring-backend test --home ${config.homeDir}`;
      output = execSync(command, { encoding: 'utf-8'});
    }
    logger.info(`Keys created and stored for ${config.keyName}`);
    logger.debug(`Key creation output: ${output}`);
  } catch (error) {
    logger.error('Error creating and storing keys:', error);
    throw error;
  }
}

async function fundLocalAccount(config: ValidatorConfig): Promise<void> {
  if (config.environment !== 'local') {
    return; // Only fund for local environment
  }

  logger.info('Funding local account...');
  try {
    const address = execSync(
      `kiichaind keys show "${config.keyName}" -a --keyring-backend test --home "${config.homeDir}"`,
      { encoding: 'utf-8' }
    ).trim();

    logger.info(`Account address: ${address}`);

    // Check if the account already has funds
    const balanceCommand = `kiichaind query bank balances ${address} --node="${config.rpcUrl}"`;
    const balanceOutput = execSync(balanceCommand, { encoding: 'utf-8' });
    logger.info(`Initial account balance: ${balanceOutput}`);

    if (!balanceOutput.includes('ukii')) {
      // Add funds directly to the genesis file
      const genesisPath = `${config.homeDir}/config/genesis.json`;
      const genesisContent = JSON.parse(fs.readFileSync(genesisPath, 'utf-8'));

      // Add the account to the auth accounts if it doesn't exist
      if (!genesisContent.app_state.auth.accounts.some((acc: any) => acc.address === address)) {
        genesisContent.app_state.auth.accounts.push({
          "@type": "/cosmos.auth.v1beta1.BaseAccount",
          "address": address,
          "pub_key": null,
          "account_number": "0",
          "sequence": "0"
        });
        logger.info(`Added account to auth.accounts in genesis file`);
      }

      // Add or update balance for the account
      const existingBalanceIndex = genesisContent.app_state.bank.balances.findIndex((bal: any) => bal.address === address);
      if (existingBalanceIndex !== -1) {
        genesisContent.app_state.bank.balances[existingBalanceIndex].coins.push({ "denom": "ukii", "amount": "100000000000" });
        logger.info(`Updated existing balance in genesis file`);
      } else {
        genesisContent.app_state.bank.balances.push({
          "address": address,
          "coins": [{ "denom": "ukii", "amount": "100000000000" }]
        });
        logger.info(`Added new balance to genesis file`);
      }

      fs.writeFileSync(genesisPath, JSON.stringify(genesisContent, null, 2));
      logger.info(`Genesis file updated with funded account`);

      // Check the balance again after funding
      const newBalanceOutput = execSync(balanceCommand, { encoding: 'utf-8' });
      logger.info(`Updated account balance: ${newBalanceOutput}`);
    } else {
      logger.info('Account already has funds. Skipping funding process.');
    }

    logger.info(`Local account ${address} funding process completed`);
  } catch (error) {
    logger.error('Error funding local account:', error);
    throw error;
  }
}


export async function createValidatorJson(config: ValidatorConfig): Promise<void> {
  const pubKey = await getPubKey(config);

  const validatorJson = {
    pubkey: { "@type": "/cosmos.crypto.ed25519.PubKey", "key": pubKey },
    amount: "10000000000ukii",
    moniker: config.moniker,
    identity: config.identity || "",
    website: config.website || "",
    security_contact: config.securityContact || "",
    details: config.details || "",
    commission_rate: config.commissionRate,
    commission_max_rate: config.commissionMaxRate,
    commission_max_change_rate: config.commissionMaxChangeRate,
    min_self_delegation: config.minSelfDelegation
  };

  fs.writeFileSync(`${config.homeDir}/validator.json`, JSON.stringify(validatorJson, null, 2));
  logger.info('validator.json file created successfully');
}


export async function createValidator(config: ValidatorConfig): Promise<void> {
  logger.info('Creating validator...');
  try {
    // Check if the account exists
    const accountCheckCommand = `kiichaind keys show ${config.keyName} --keyring-backend=test --home="${config.homeDir}"`;
    try {
      const accountInfo = execSync(accountCheckCommand, { encoding: 'utf8' });
      logger.info(`Account found: ${accountInfo}`);
    } catch (error) {
      logger.error(`Account not found: ${error}`);
      throw new Error(`Account ${config.keyName} not found. Please make sure it's created.`);
    }

    // Check account balance
    const addressCommand = `kiichaind keys show ${config.keyName} -a --keyring-backend=test --home="${config.homeDir}"`;
    const address = execSync(addressCommand, { encoding: 'utf8' }).trim();
    const balanceCommand = `kiichaind query bank balances ${address} --node="${config.rpcUrl}"`;
    const balanceOutput = execSync(balanceCommand, { encoding: 'utf8' });
    logger.info(`Account balance: ${balanceOutput}`);

    if (!balanceOutput.includes('ukii')) {
      throw new Error('Account has no ukii tokens. Please ensure the account is funded.');
    }

    const validatorJsonPath = `${config.homeDir}/validator.json`;
    const validatorJson = JSON.parse(fs.readFileSync(validatorJsonPath, 'utf8'))
    const amount = validatorJson.amount;
    const pubkey = JSON.stringify(validatorJson.pubkey);

    const command = `kiichaind tx staking create-validator \
      --amount="${amount}" \
      --pubkey='${pubkey}' \
      --moniker="${config.moniker}" \
      --chain-id=${config.chainId} \
      --commission-rate="${config.commissionRate}" \
      --commission-max-rate="${config.commissionMaxRate}" \
      --commission-max-change-rate="${config.commissionMaxChangeRate}" \
      --min-self-delegation="${config.minSelfDelegation}" \
      --from="${config.keyName}" \
      --keyring-backend=test \
      --home="${config.homeDir}" \
      --node="${config.rpcUrl}" \
      --gas="auto" \
      --gas-adjustment="1.5" \
      --gas-prices="0.025ukii" \
      --yes`;

    logger.debug(`Executing command: ${command}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logger.info('Validator created successfully');
    logger.debug(`Command output: ${result}`);
  } catch (error) {
    logger.error('Error creating validator:', error);
    if (error instanceof Error) {
      logger.error(`Error message: ${error.message}`);
      if ('stderr' in error) {
        logger.error(`Error stderr: ${(error as any).stderr}`);
      }
    }
    throw error;
  }
}

export async function implementStateSync(config: ValidatorConfig): Promise<void> {
  if (config.environment === 'local') {
    logger.info('State sync disabled for local environment');
    updateConfigWithoutStateSync(config);
    return;
  }

  logger.info('Implementing state sync and updating node configuration...');

  const stateSyncEndpoints = config.environment === 'testnet'
    ? networkConfig.testnet.rpcEndpoints
    : networkConfig.mainnet.rpcEndpoints;

  let blockInfo: { height: number; hash: string } | null = null;

  for (const endpoint of stateSyncEndpoints) {
    blockInfo = await fetchBlockInfoWithRetry(endpoint);
    if (blockInfo) {
      logger.info(`Successfully fetched block info from ${endpoint}`);
      break;
    }
  }

  if (!blockInfo) {
    logger.warn('Failed to fetch valid block info. Proceeding with default configuration without state sync.');
    updateConfigWithoutStateSync(config);
    return;
  }

  // Update config.toml with state sync information
  const configPath = `${config.homeDir}/config/config.toml`;
  let configContent = fs.readFileSync(configPath, 'utf8');

  configContent = configContent.replace(/enable = false/, 'enable = true');
  configContent = configContent.replace(/trust_height = 0/, `trust_height = ${blockInfo.height}`);
  configContent = configContent.replace(/trust_hash = ""/, `trust_hash = "${blockInfo.hash}"`);
  configContent = configContent.replace(/rpc_servers = ""/, `rpc_servers = "${stateSyncEndpoints.join(',')}"`);

  // P2P configuration
  configContent = configContent.replace(/seeds = ""/g, `seeds = "${networkConfig.testnet.seeds.join(',')}"`);
  configContent = configContent.replace(/persistent_peers = ""/g, `persistent_peers = "${networkConfig.testnet.persistentPeers.join(',')}"`);

  // Pruning configuration (optional, adjust as needed)
  configContent = configContent.replace(/pruning = "default"/g, 'pruning = "custom"');
  configContent = configContent.replace(/pruning-keep-recent = "0"/g, 'pruning-keep-recent = "100"');
  configContent = configContent.replace(/pruning-interval = "0"/g, 'pruning-interval = "10"');

  // Prometheus metrics (optional)
  configContent = configContent.replace(/prometheus = false/g, 'prometheus = true');

  fs.writeFileSync(configPath, configContent);

  // Update app.tomlf
  const appConfigPath = `${config.homeDir}/config/app.toml`;
  let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');

  // Minimum gas prices
  appConfigContent = appConfigContent.replace(/minimum-gas-prices = ""/g, 'minimum-gas-prices = "0.025ukii"');

  // API configuration
  appConfigContent = appConfigContent.replace(/enable = false/g, 'enable = true');

  fs.writeFileSync(appConfigPath, appConfigContent);

  logger.info('State sync implemented and configuration updated');
  logger.info(`Trust height: ${blockInfo.height}`);
  logger.info(`Trust hash: ${blockInfo.hash}`);
  logger.info(`RPC servers: ${stateSyncEndpoints.join(',')}`);
  logger.info('State sync successfully implemented');
}

function updateConfigWithoutStateSync(config: ValidatorConfig): void {
  const configPath = `${config.homeDir}/config/config.toml`;
  let configContent = fs.readFileSync(configPath, 'utf8');

  configContent = configContent.replace(/enable = true/, 'enable = false');
  configContent = configContent.replace(/trust_height = \d+/, 'trust_height = 0');
  configContent = configContent.replace(/trust_hash = "[^"]+"/, 'trust_hash = ""');
  configContent = configContent.replace(/rpc_servers = "[^"]+"/, 'rpc_servers = ""');

  // Ensure other necessary configurations are still in place
  configContent = configContent.replace(/seeds = ""/, `seeds = "${networkConfig.testnet.seeds.join(',')}"`);
  configContent = configContent.replace(/persistent_peers = ""/, `persistent_peers = "${networkConfig.testnet.persistentPeers.join(',')}"`);

  fs.writeFileSync(configPath, configContent);
  logger.info('Updated configuration to proceed without state sync.');
}

async function getPubKey(config: ValidatorConfig): Promise<string> {
  try {
    const pubKey = execSync(`kiichaind tendermint show-validator --home ${config.homeDir}`, { encoding: 'utf8' }).trim();
    return JSON.parse(pubKey).key;
  } catch (error) {
    logger.error('Error getting pubkey:', error);
    throw error;
  }
}

async function fetchBlockInfoWithRetry(endpoint: string, maxRetries: number = 3): Promise<{ height: number; hash: string } | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(`${endpoint}/block`);
      if (response.data?.result?.block) {
        const blockInfo = {
          height: parseInt(response.data.result.block.header.height),
          hash: response.data.result.block_id.hash
        };
        if (isValidBlockInfo(blockInfo)) {
          return blockInfo;
        }
      } else if (response.data?.code === 12 && response.data?.message === "Not Implemented") {
        logger.warn(`Endpoint ${endpoint} does not implement the required method.`);
        break; // No need to retry this endpoint
      }
    } catch (error) {
      logger.warn(`Attempt ${i + 1} failed to fetch block info from ${endpoint}: ${error}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between retries
  }
  return null;
}

function isValidBlockInfo(blockInfo: any): boolean {
  return (
    blockInfo &&
    typeof blockInfo.height === 'number' &&
    typeof blockInfo.hash === 'string' &&
    blockInfo.hash.length > 0
  );
}

export async function deployValidator(config: ValidatorConfig): Promise<void> {
  if (config.environment === 'mainnet') {
    const confirmation = await confirmMainnetDeployment();
    if (!confirmation) {
      logger.info('Mainnet deployment cancelled.');
      return;
    }
  }

  await initializeNode(config);
  await createAndStoreKeys(config);
  await fundLocalAccount(config);
  if (config.environment !== 'local') {
    await implementStateSync(config);
  }
  await createValidatorJson(config);

  // Ensure the node is running
  try {
    const statusCommand = `kiichaind status --node="${config.rpcUrl}"`;
    const statusOutput = execSync(statusCommand, { encoding: 'utf8' });
    logger.info(`Node status: ${statusOutput}`);
  } catch (error) {
    logger.error('Error checking node status:', error);
    throw new Error('Node is not running or not accessible. Please start the node before creating a validator.');
  }

  // Wait for a few seconds to ensure the node is fully operational
  await new Promise(resolve => setTimeout(resolve, 5000));

  await createValidator(config);

  logger.info(`Validator successfully deployed to ${config.environment}!`);
  if (config.environment !== 'local') {
    logger.info('Please manually swap KII tokens to sKII and delegate to your validator.');
    logger.info(`Use the Kii Block Explorer Dashboard to swap and delegate.`);
  }
}

async function confirmMainnetDeployment(): Promise<boolean> {
  // Implement a confirmation mechanism here, e.g., prompt the user
  // Return true if confirmed, false otherwise
  return false; // Placeholder implementation
}