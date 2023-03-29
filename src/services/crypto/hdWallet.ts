import bip39 from 'bip39';
// import bip32 from 'bip32';
// import EtheremUtil from 'ethereumjs-util';
// import bitcoin from 'bitcoinjs-lib';
// import { ethers } from 'ethers';

export default class HDWallet {
	generateMnemonic() {
		const mnemonic = bip39.generateMnemonic();
		console.log({ mnemonic });
		return mnemonic;
	}
}
