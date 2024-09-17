# Kii Chain Validator Deployer

This guide provides instructions for deploying and managing a Kii Chain validator node on both mainnet and testnet.

## Prerequisites

- Node.js and npm installed
- Go environment set up
- `kiichaind` installed

## Setup

1. Clone the repository and install dependencies:
   ```
   git clone <repository-url>
   cd <repository-directory>
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

## Deployment

### Testnet

1. Deploy the validator:
   ```
   npm run deploy
   ```

2. Run the node:
   ```
   node dist/runNode.js
   ```

3. Start the node with key generation:
   ```
   node dist/startNode.js
   ```

### Mainnet

1. Deploy the validator (use with caution):
   ```
   npm run deploy -- --mainnet
   ```

2. Run the node:
   ```
   node dist/runNode.js
   ```

3. Start the node with key generation:
   ```
   node dist/startNode.js
   ```

## Monitoring and Management

1. Check if the validator deployer is running:
   ```
   kiichaind status
   ```

2. Check if your validator is active:
   ```
   kiichaind query staking validator $(kiichaind keys show $YOUR_KEY_NAME -a)
   ```

3. Check your validator's voting power:
   ```
   kiichaind status | jq .ValidatorInfo
   ```

4. Check your balance:
   ```
   kiichaind query bank balances $(kiichaind keys show $YOUR_KEY_NAME -a)
   ```

5. Unjail your validator if it gets jailed:
   ```
   kiichaind tx slashing unjail --from $YOUR_KEY_NAME --chain-id $CHAIN_ID
   ```

6. Update your validator:
   ```
   kiichaind tx staking edit-validator \
     --new-moniker="new_moniker" \
     --website="new_website" \
     --identity="new_identity" \
     --details="new_details" \
     --chain-id=$CHAIN_ID \
     --from=$YOUR_KEY_NAME
   ```

Replace `$YOUR_KEY_NAME` with your actual key name and `$CHAIN_ID` with the appropriate chain ID (e.g., `kiichain-testnet` for testnet or `kiichain-1` for mainnet).

## Important Notes

- Always ensure you're using the correct network (testnet or mainnet) when performing transactions.
- Make sure your node is fully synced before performing any validator operations.
- Keep your private keys and mnemonics secure and never share them.
- Regularly check for updates to the Kii Chain software and this deployer.

For more detailed information, refer to the official Kii Chain documentation.