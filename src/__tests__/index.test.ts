import { program } from 'commander';
import '../index';

jest.mock('commander', () => ({
  program: {
    version: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    requiredOption: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    parse: jest.fn(),
  },
}));

describe('CLI', () => {
  it('should set up the CLI correctly', () => {
    expect(program.version).toHaveBeenCalledWith('0.1.0');
    expect(program.description).toHaveBeenCalledWith('KiiChain Validator Deployer');
    expect(program.option).toHaveBeenCalledWith('-s, --setup', 'Run setup script to install dependencies');
    expect(program.requiredOption).toHaveBeenCalledWith('-c, --config <path>', 'Path to config file');
    expect(program.action).toHaveBeenCalled();
  });
});