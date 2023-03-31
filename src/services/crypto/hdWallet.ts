import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { HDNodeWallet } from 'ethers';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BIP84 = require('bip84');

const ethereumPath = "m/44'/60'/0'/0/0";

export default class HDWallet {
	generateMnemonic() {
		const mnemonic = generateMnemonic();
		console.log({ mnemonic });
		return mnemonic;
	}

	getEthAddressFromMnemonic(mnemonic: string) {
		const seed = mnemonicToSeedSync(mnemonic);
		const node = HDNodeWallet.fromSeed(seed);
		const ethNode = node.derivePath(ethereumPath);
		return {
			ethereumPrivateKey: ethNode.privateKey,
			ethAddress: ethNode.address,
		};
	}

	getBtcAddressFromMnemonic(mnemonic: string) {
		const root = new BIP84.fromMnemonic(mnemonic);
		const child0 = root.deriveAccount(0);

		const account0 = new BIP84.fromZPrv(child0);
		const privateKey = account0.getPrivateKey(0);
		const publicKey = account0.getPublicKey(0);
		const address = account0.getAddress(0);
		return {
			bitcoinPrivateKey: privateKey,
			btcAddress: address,
			btcPublicKey: publicKey,
		};
	}
}
