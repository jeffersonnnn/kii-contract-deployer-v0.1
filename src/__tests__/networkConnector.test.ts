import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  initializeNode,
  connectToNetwork,
  createValidator,
  ValidatorConfig
} from '../networkConnector';

jest.mock('fs');
jest.mock('child_process');

const mockConfig: ValidatorConfig = {
  moniker: 'TestValidator',
  identity: '1234567890',
  website: 'https://testvalidator.com',
  securityContact: 'security@testvalidator.com',
  details: 'A test validator',
  commissionRate: '0.10',
  commissionMaxRate: '0.20',
  commissionMaxChangeRate: '0.01',
  minSelfDelegation: '1',
  rpcEndpoints: ['http://localhost:26657'],
  chainId: 'kiiventador',
  homeDir: '/tmp/kiitest',
};

const mockPassword = 'testpassword';

describe('networkConnector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.appendFileSync as jest.Mock).mockImplementation(() => {});
  });

  test('initializeNode should initialize the node correctly', async () => {
    await initializeNode(mockConfig, mockPassword);

    expect(execSync).toHaveBeenCalledWith(
      `kiichaind init ${mockConfig.moniker} --chain-id ${mockConfig.chainId} --home ${mockConfig.homeDir} -o`,
      expect.any(Object)
    );
    expect(execSync).toHaveBeenCalledWith(
      `curl -o ${path.join(mockConfig.homeDir, 'config', 'genesis.json')} https://raw.githubusercontent.com/KiiChain/kii/main/networks/testnet/genesis.json`,
      expect.any(Object)
    );
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // Once for app.toml and once for config.toml
  });

  test('connectToNetwork should start the KiiChain node', async () => {
    await connectToNetwork(mockConfig);

    expect(execSync).toHaveBeenCalledWith(
      `kiichaind start --home ${mockConfig.homeDir}`,
      expect.any(Object)
    );
  });

  test('createValidator should create a validator correctly', async () => {
    await createValidator(mockConfig, mockPassword);

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(`kiichaind tx staking create-validator --home ${mockConfig.homeDir}`),
      expect.any(Object)
    );
  });
});