import { UserAttributes } from '@/common/dynamo/schema';
import { getUserCompositeKey } from '@/services/auth/auth';
import { contractAbi } from '@/services/crypto/contractAbi';
import { IWallet } from '@/services/user/types';
import AWS from 'aws-sdk';
import Web3 from 'web3';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

const web3 = new Web3(
	new Web3.providers.HttpProvider(
		'https://polygon-mainnet.infura.io/v3/49dfcdb7a3254aaab0ff651e6d0ed870'
	)
);

export class CryptoService {
	async createCryptoWallet(phoneNumber: string) {
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		web3.eth.accounts.wallet.add(account);
		console.log(account);
		const wallet: IWallet = {
			privateKey: account.privateKey,
			publicKey: account.address,
			chain: 'mainnet',
			network: 'polygon',
		};

		const params = {
			TableName,
			Key: getUserCompositeKey(phoneNumber),
			UpdateExpression: `SET #wallets = :wallets`,
			ExpressionAttributeNames: {
				'#wallets': UserAttributes.WALLETS,
			},
			ExpressionAttributeValues: {
				':wallets': [wallet],
			},
		};

		await dynamo.update(params).promise();
	}

	sendFundsToMasterWallet() {
		//
	}

	async makeTransaction(
		sourcePublicKey: string,
		targetPublicKey: string,
		sourcePrivateKey: string
	) {
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
			sourcePrivateKey
		);
		web3.eth.sendSignedTransaction(signedTx.rawTransaction, (error, hash) => {
			if (!error) {
				console.log(
					'🎉 The hash of your transaction is: ',
					hash,
					"\n Check Alchemy's Mempool to view the status of your transaction!"
				);
			} else {
				console.log(
					'❗Something went wrong while submitting your transaction:',
					error
				);
			}
		});
	}

	async sendERC20Transaction(
		sourcePublicKey: string,
		targetPublicKey: string,
		sourcePrivateKey: string,
		amount: number
	) {
		const contractAddress = '0x56705db9f87c8a930ec87da0d458e00a657fccb0';
		web3.eth.accounts.wallet.add(sourcePrivateKey);
		const tokenContract = new web3.eth.Contract(contractAbi, contractAddress);
		const transaction = await tokenContract.methods
			.transfer(targetPublicKey, amount)
			.send({
				from: sourcePublicKey,
				gasLimit: 21560,
				gas: 128028,
			});
		return transaction;
	}
}
