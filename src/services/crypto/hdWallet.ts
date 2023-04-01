import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { HDNodeWallet } from 'ethers';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BIP84 = require('bip84');

const ethereumPath = "m/44'/60'/0'/0/0";

type MnemonicOptios = {
	isPublic?: boolean;
};

type AddressPack = {
	address: string;
	privateKey?: string;
};

export default class HDWallet {
	generateMnemonic() {
		const mnemonic = generateMnemonic();
		console.log({ mnemonic });
		return mnemonic;
	}

	getEthAddressFromMnemonic(
		mnemonic: string,
		params: MnemonicOptios = {}
	): AddressPack {
		const { isPublic } = params;
		const seed = mnemonicToSeedSync(mnemonic);
		const node = HDNodeWallet.fromSeed(seed);
		const ethNode = node.derivePath(ethereumPath);
		const pack = {
			privateKey: ethNode.privateKey,
			address: ethNode.address,
		};
		if (isPublic) {
			delete pack.address;
		}
		return pack;
	}

	getBtcAddressFromMnemonic(
		mnemonic: string,
		params: MnemonicOptios = {}
	): AddressPack {
		const { isPublic } = params;
		const root = new BIP84.fromMnemonic(mnemonic);
		const child0 = root.deriveAccount(0);

		const account0 = new BIP84.fromZPrv(child0);
		const privateKey = account0.getPrivateKey(0) as string;
		// const publicKey = account0.getPublicKey(0);
		const address = account0.getAddress(0) as string;
		const pack = {
			privateKey,
			address,
		};
		if (isPublic) {
			delete pack.privateKey;
		}
		return pack;
	}
}
