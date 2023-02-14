import { UserAttributes } from '@/common/dynamo/schema';
import { getUserCompositeKey } from '@/services/auth/auth';
import { IWallet } from '@/services/user/types';
import AWS from 'aws-sdk';
import Web3 from 'web3';
import PusherService from '@/services/pusher/pusher';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

const getWeb3Instance = () => {
	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			'https://nd-552-463-930.p2pify.com/14b83362eb8642f9ebc4922235a55a15'
		)
	);
	return web3;
};

export class CryptoService {
	async createCryptoWallet(phoneNumber: string) {
		const web3 = getWeb3Instance();
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		web3.eth.accounts.wallet.add(account);

		const wallet: IWallet = {
			privateKey: account.privateKey,
			publicKey: account.address,
			chain: 'mainnet',
			network: 'polygon',
			phoneNumber,
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

		const pusherService = new PusherService();

		await pusherService.triggerUsersWalletsUpdated();
		return account;
	}

	async createMasterWallet() {
		const web3 = getWeb3Instance();
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		web3.eth.accounts.wallet.add(account);
		return account;
	}
}
