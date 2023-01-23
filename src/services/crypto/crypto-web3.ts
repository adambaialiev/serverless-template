import Web3 from 'web3';
import { contractAbi } from './constants';

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
		const ownerAddress = '0xC7E966B2b80738458ddF304D586058E900a4C25b';
		const nonce = await web3.eth.getTransactionCount(ownerAddress, 'latest');
		const transaction = {
			'to': '0xb5A59D7AbAD4f5aa0c95FD799C17985ed8b3bb5e',
			'value': web3.utils.toWei('.000001', 'ether'),
			'gas': '128028',
			'gasPrice': web3.utils.toWei('0.00000002', 'ether'),
			'nonce': nonce,
		};
		const signedTx = await web3.eth.accounts.signTransaction(transaction, '0x997ac31ca6c895d405287e2a2eed95de7e1093e373ba93844f6c95744f821333');
		web3.eth.sendSignedTransaction(signedTx.rawTransaction, (error, hash) => {
			if (!error) {
				console.log('🎉 The hash of your transaction is: ', hash, '\n Check Alchemy\'s Mempool to view the status of your transaction!');
			} else {
				console.log('❗Something went wrong while submitting your transaction:', error);
			}
		});
	}

	async sendERC20Transaction() {
		const fromAddress = '0xC7E966B2b80738458ddF304D586058E900a4C25b';
		const toAddress = '0xb5A59D7AbAD4f5aa0c95FD799C17985ed8b3bb5e';
		const privateKey = '0x997ac31ca6c895d405287e2a2eed95de7e1093e373ba93844f6c95744f821333';
		const contractAddress = '0x56705DB9F87c8a930Ec87Da0D458E00A657Fccb0';
		const USDT = new web3.eth.Contract(contractAbi, contractAddress, { from: fromAddress });
		const amount = web3.utils.toHex(2710);

		const nonce = await web3.eth.getTransactionCount(fromAddress, 'latest');

		const transaction = {
			'from': fromAddress,
			'gasPrice': web3.utils.toHex(2000000),
			'gasLimit': web3.utils.toHex(6000000),
			'gas': web3.utils.toHex(100000),
			'to': contractAddress,
			'value': web3.utils.toWei('.00001', 'ether'),
			'data': USDT.methods.transfer(toAddress, amount).encodeABI(),
			'nonce': nonce,
		};
		const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
		web3.eth.sendSignedTransaction(signedTx.rawTransaction, (error, hash) => {
			if (!error) {
				console.log('success', hash);
			} else {
				console.log('error', error);
			}
		});

	}
}

const cryptoService = new CryptoWeb3Service();
cryptoService.sendERC20Transaction();

export { CryptoWeb3Service };
