# Kiichain Validator Setup

## Overview

This project is focused on setting up a local node and validator for the Kiichain blockchain. The Kiichain blockchain is a decentralized network that leverages the Cosmos SDK and Tendermint consensus engine to provide a scalable and secure platform for decentralized applications.

## Project Structure

- **kiichain/localsetup.txt**: Contains local setup information including addresses, public keys, and mnemonics for the validator and genesis tokens.
- **kiichain/genesis/genesis.json**: The genesis file for the Kiichain blockchain, which includes initial state and configuration parameters.
- **.tmp/kiichaind/**: Temporary directory for the Kiichain node, including configuration files and keys.
- **src/validator-config.json**: Configuration file for the validator, including chain ID, home directory, mnemonic, and other validator-specific settings.
- **.env**: Environment variables for the project, including network settings, node configuration, and validator details.
- **kii/config.yml**: Configuration file for the KiiChain, including account balances and validator settings.

## Prerequisites

- **Go**: Ensure you have Go installed on your machine.
- **Node.js**: Ensure you have Node.js installed on your machine.
- **Kiichain CLI**: Install the Kiichain CLI tools.

## Setup Instructions

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/yourusername/kiichain-validator-setup.git
   cd kiichain-validator-setup
   ```

2. **Install Dependencies**:
   ```sh
   make install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following content:
   ```env
   # Network settings
   NETWORK=local  # Change to 'testnet' for testnet deployment
   MAINNET_CHAIN_ID=kiichain-1
   TESTNET_CHAIN_ID=123454321

   # Node configuration
   NODE_HOME_DIR=.tmp/kiichaind
   VALIDATOR_MONIKER="Kiichain Validator 1"
   VALIDATOR_KEY_NAME=validator
   VALIDATOR_MNEMONIC="pink remind surprise bird angry helmet predict open become bundle shrimp wire alter favorite kite kidney rice donor endless subject snake regular hammer minute"

   # Local specific
   LOCAL_CHAIN_ID="kiichain-1"
   LOCAL_RPC_URL="http://localhost:26657"

   # Testnet specific
   TESTNET_RPC_URL=https://a.sentry.testnet.kiivalidator.com:8645

   # Common settings
   CURRENCY_SYMBOL=kii

   # Validator details
   VALIDATOR_HOME_DIR=".tmp/kiichaind"
   VALIDATOR_COMMISSION_RATE="0.100000000000000000"
   VALIDATOR_COMMISSION_MAX_RATE="0.200000000000000000"
   VALIDATOR_COMMISSION_MAX_CHANGE_RATE="0.010000000000000000"
   VALIDATOR_MIN_SELF_DELEGATION="1"

   # Additional accounts (for local setup)
   GENESIS_TOKENS_ADDRESS="kii1rulde6qtql8th6yppwygw3sv48aras03fwpjga"
   GENESIS_TOKENS_MNEMONIC="pill certain upset auction siege chief soup top tuna replace forest message glance input admit differ wink acid duty secret alarm broken leg kangaroo"

   # Node ID and other details
   NODE_ID="8a200f30d75960112c159b881ad8ea9986e06183"
   ```

4. **Start the Local Node**:
   ```sh
   make start
   ```

5. **Create and Fund Validator Account**:
   Follow the instructions in `kiichain/README.md` to create and fund the validator account.

## Important Commands

- **Check Node Status**:
  ```sh
  kiichaind status --node="http://localhost:26657"
  ```

- **Query Account**:
  ```sh
  kiichaind query account <account_address> --node="http://localhost:26657"
  ```

- **Send Tokens**:
  ```sh
  kiichaind tx bank send <from_address> <to_address> <amount> --chain-id="kiichain-local" --keyring-backend=test --home=".tmp/kiichaind" --node="http://localhost:26657"
  ```

## Troubleshooting

- **Node Syncing Issues**: If you encounter issues with the node syncing, ensure that the node is fully synced by checking the node status.
- **Account Not Found**: If you receive an "account not found" error, ensure that the account has been created and funded correctly.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or support, please reach out to the project maintainer at [your-email@example.com].
