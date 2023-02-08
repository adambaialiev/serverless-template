import { UserAttributes } from '@/common/dynamo/schema';
import { getUserCompositeKey } from '@/services/auth/auth';
import { contractAbi } from '@/services/crypto/contractAbi';
import MasterWallet from '@/services/masterWallet/masterWallet';
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

	async sendMaticToAddress(publicKey: string, amount: string) {
		const masterWalletService = new MasterWallet();
		const masterWallet = await masterWalletService.getMasterWallet();
		if (!masterWallet) {
			return;
		}
		const signer = web3.eth.accounts.privateKeyToAccount(
			masterWallet.privateKey
		);
		web3.eth.accounts.wallet.add(signer);
		// Creating the transaction object
		const tx = {
			from: signer.address,
			to: publicKey,
			value: web3.utils.toWei(amount),
			gas: 0,
		};
		// Assigning the right amount of gas
		tx.gas = await web3.eth.estimateGas(tx);

		const transactionHash = await new Promise<string | undefined>((resolve) => {
			// Sending the transaction to the network
			web3.eth.sendTransaction(tx).once('transactionHash', (txhash) => {
				console.log(`Mining transaction ...`);
				console.log(`Transaction hash: ${txhash}`);
				resolve(txhash);
			});
		});
		return transactionHash;
	}

	async makePolygonUsdtTransactionToMasterWallet(
		privateKey: string,
		sourcePublicKey: string,
		amount: string
	) {
		const masterWalletService = new MasterWallet();
		const masterWallet = await masterWalletService.getMasterWallet();
		if (masterWallet) {
			const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(signer);
			const contractAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

			const contract = new web3.eth.Contract(contractAbi, contractAddress);

			const hash = await new Promise<string | undefined>((resolve) => {
				contract.methods
					.transfer(sourcePublicKey, amount)
					.send({ from: signer.address })
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.on('transactionHash', (hash: any) => {
						console.log({ hash });
						resolve(hash);
					});
			});
			return hash;
		}
	}
}
