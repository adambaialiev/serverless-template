import Web3 from "web3";

const web3 = new Web3(new Web3.providers.HttpProvider('https://goerli.infura.io/v3/49dfcdb7a3254aaab0ff651e6d0ed870'));

class CryptoWeb3Service {
	createCryptoWallet() {
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		const wallet = web3.eth.accounts.wallet.add(account);
		wallet.encrypt(web3.utils.randomHex(32));
		console.log(account);
		return account;
	}
	async makeTransaction() {
		const ownerAddress = "0xC7E966B2b80738458ddF304D586058E900a4C25b";
		const nonce = await web3.eth.getTransactionCount(ownerAddress, 'latest');
		const transaction = {
			'to': '0xb5A59D7AbAD4f5aa0c95FD799C17985ed8b3bb5e',
			'value': web3.utils.toWei(".000001", "ether"),
			'gas': "128028",
			'gasPrice': web3.utils.toWei("0.00000002", "ether"),
			'nonce': nonce,
		};
		const signedTx = await web3.eth.accounts.signTransaction(transaction, "0x997ac31ca6c895d405287e2a2eed95de7e1093e373ba93844f6c95744f821333");
		web3.eth.sendSignedTransaction(signedTx.rawTransaction, (error, hash) => {
			if (!error) {
				console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
			} else {
				console.log("❗Something went wrong while submitting your transaction:", error)
			}
		});
	}
}

const cryptoService = new CryptoWeb3Service();
cryptoService.createCryptoWallet()
cryptoService.makeTransaction();

export {CryptoWeb3Service}
