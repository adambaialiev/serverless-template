import Web3 from "web3";
import {Transaction} from "@ethereumjs/tx";
import { Common } from '@ethereumjs/common';
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/49dfcdb7a3254aaab0ff651e6d0ed870'));

class CryptoWeb3Service {
	createCryptoWallet() {
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		const wallet = web3.eth.accounts.wallet.add(account);
		wallet.encrypt(web3.utils.randomHex(32));
		console.log(account);
		return account;
	}
	makeTransaction() {
		const rawTx = {
			to: '0x5b330611f72Ca2E9E82CE619868874beB41eA97d',
			from: '0x670eFFEA73Cd25D1056Ab0eD21047796c9f5475e',
			value: '100',
			data: "0x",
			chainId: 1,
			nonce: '0x2a',
			gasPrice: '0x4a717c800',
			gasLimit: '0xc340'
		}
		const tx = new Transaction(rawTx, {common: new Common({'chain': 'ropsten'})})
		const signedTx = tx.sign(new Buffer("0xfd39b21ab0221c57c4b0b75e2d8d367820db889495224c1a8bc020f3041cb8c8"));

		const serializedTx = signedTx.serialize();

		web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
			.on('receipt', console.log);
	}
}

const cryptoService = new CryptoWeb3Service();
// cryptoService.createCryptoWallet()
cryptoService.makeTransaction();

export {CryptoWeb3Service}