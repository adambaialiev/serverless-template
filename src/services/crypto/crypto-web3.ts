import Web3 from 'web3';
import { contractAbi } from '../crypto/constants';

const web3 = new Web3(
	new Web3.providers.HttpProvider(
		'https://goerli.infura.io/v3/49dfcdb7a3254aaab0ff651e6d0ed870',
	),
);

class CryptoWeb3Service {
	createCryptoWallet() {
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		web3.eth.accounts.wallet.add(account);
		console.log(account);
		return account;
	}

	async makeTransaction(sourcePublicKey: string, targetPublicKey: string, sourcePrivateKey: string) {
		const nonce = await web3.eth.getTransactionCount(sourcePublicKey, 'latest');
		const transaction = {
			to: targetPublicKey,
			value: web3.utils.toWei('.000001', 'ether'),
			gas: '128028',
			gasPrice: web3.utils.toWei('0.00000002', 'ether'),
			nonce: nonce,
		};
		const signedTx = await web3.eth.accounts.signTransaction(
			transaction,
			sourcePrivateKey,
		);
		web3.eth.sendSignedTransaction(signedTx.rawTransaction, (error, hash) => {
			if (!error) {
				console.log(
					'🎉 The hash of your transaction is: ',
					hash,
					'\n Check Alchemy\'s Mempool to view the status of your transaction!',
				);
			} else {
				console.log(
					'❗Something went wrong while submitting your transaction:',
					error,
				);
			}
		});
	}

	async sendERC20Transaction(sourcePublicKey: string, targetPublicKey: string, sourcePrivateKey: string, amount: number) {
		const contractAddress = '0x56705db9f87c8a930ec87da0d458e00a657fccb0';
		web3.eth.accounts.wallet.add(sourcePrivateKey);
		const tokenContract = new web3.eth.Contract(contractAbi, contractAddress);
		const transaction = await tokenContract.methods.transfer(targetPublicKey, amount).send({
			from: sourcePublicKey,
			gasLimit: 21560,
			gas: 128028,
		});
		// console.log('hash --->', transaction);
		return transaction;
	}

	watchTransactions(contractAddress: string, targetPublicKey: string) {
		const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://goerli.infura.io/ws/v3/49dfcdb7a3254aaab0ff651e6d0ed870'));
		const tokenContract = new web3.eth.Contract(contractAbi, contractAddress);
		const options = {
			filter: {
				_to: targetPublicKey,
			},
			fromBlock: 'latest',
		};
		// tokenContract.events.Transfer(options, (error: any, event: any) => {
		// 	if (error) {
		// 		console.log('error', error);
		// 	}
		// 	console.log('event ---->', event);
		// });
		tokenContract.events.Transfer(() => {
			//
		}).on('connected', (subscriptionId: any) => {
			console.log({ subscriptionId });
		}).on('data', (dataEvent: any) => {
			console.log({ dataEvent }, dataEvent.to);
		}).on('changed', (changedEvent: any) => {
			console.log({ changedEvent });
		});
	}
}

const cryptoService = new CryptoWeb3Service();
cryptoService.watchTransactions('0x56705db9f87c8a930ec87da0d458e00a657fccb0', '0xb5A59D7AbAD4f5aa0c95FD799C17985ed8b3bb5e');
cryptoService.sendERC20Transaction('0xC7E966B2b80738458ddF304D586058E900a4C25b', '0xb5A59D7AbAD4f5aa0c95FD799C17985ed8b3bb5e', '0x997ac31ca6c895d405287e2a2eed95de7e1093e373ba93844f6c95744f821333', 0);

export { CryptoWeb3Service };
