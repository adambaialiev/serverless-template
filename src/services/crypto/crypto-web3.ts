import Web3 from "web3";

class CryptoWeb3Service {
	createCryptoWallet() {
		const web3 = new Web3(new Web3.providers.HttpProvider('https://localhost:8545'));
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		const wallet = web3.eth.accounts.wallet.add(account);
		wallet.encrypt(web3.utils.randomHex(32));
		return account;
	}
}

export {CryptoWeb3Service}