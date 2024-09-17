import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function installDependencies() {
  console.log('Installing dependencies...');
  if (process.platform === 'darwin') {
    // macOS
    execSync('brew update', { stdio: 'inherit' });
    execSync('brew install jq', { stdio: 'inherit' });
  } else if (process.platform === 'linux') {
    // Linux
    execSync('sudo apt-get update && sudo apt-get install -y jq', { stdio: 'inherit' });
  } else {
    throw new Error('Unsupported platform. Please install jq manually.');
  }
  execSync('curl -L https://foundry.paradigm.xyz | bash', { stdio: 'inherit' });
  execSync('foundryup', { stdio: 'inherit' });
  console.log('Dependencies installed.');
}

function setupKiiChain() {
  console.log('Setting up KiiChain...');
  const kiichainDir = path.join(process.cwd(), 'kiichain');
  if (fs.existsSync(kiichainDir)) {
    console.log('KiiChain directory already exists. Updating...');
    process.chdir(kiichainDir);
    execSync('git pull', { stdio: 'inherit' });
  } else {
    console.log('Cloning KiiChain repository...');
    execSync('git clone https://github.com/KiiChain/kiichain.git', { stdio: 'inherit' });
    process.chdir(kiichainDir);
  }
  execSync('make build-clean', { stdio: 'inherit' });
  console.log('KiiChain setup completed.');
}

export function setup() {
  installDependencies();
  setupKiiChain();
}

if (require.main === module) {
  setup();
}