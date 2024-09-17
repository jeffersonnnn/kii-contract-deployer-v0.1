import * as bip39 from 'bip39';
import hdkey from 'hdkey';
import * as crypto from 'crypto';

export interface Keys {
  mnemonic: string;
  privateKey: string;
  publicKey: string;
}

export async function generateKeys(): Promise<Keys> {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = hdkey.fromMasterSeed(seed);
  const addrNode = root.derive("m/44'/118'/0'/0/0"); // Cosmos HD path

  const privateKey = addrNode.privateKey.toString('hex');
  const publicKey = crypto.createPublicKey({
    key: addrNode.privateKey,
    format: 'der',
    type: 'spki',
  }).export({ format: 'der', type: 'spki' }).toString('hex');

  return { mnemonic, privateKey, publicKey };
}