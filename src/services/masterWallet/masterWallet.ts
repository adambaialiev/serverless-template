import {
	buildHomePendingKey,
	buildHomeSuccessKey,
	buildTouchPendingKey,
	buildTouchSuccessKey,
	buildTransactionKey,
	buildUserKey,
	buildWithdrawalPendingKey,
	buildWithdrawalSuccessKey,
} from '@/common/dynamo/buildKey';
import {
	Entities,
	MasterWalletAttributes,
	MasterWalletInvolvedTransactionAttributes,
	MasterWalletInvolvedTransactionItem,
	MasterWalletItem,
	TableKeys,
	TransactionAttributes,
} from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import PusherService from '@/services/pusher/pusher';
import UserService from '@/services/user/user';
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export interface IMasterWallet {
	publicAddress: string;
	privateKey: string;
	network: string;
}

export default class MasterWallet {
	async createMasterWalletIfNeeded() {
		const cryptoService = new CryptoService();

		const mainWalletOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.MASTER_WALLET,
					[TableKeys.SK]: Entities.MASTER_WALLET,
				},
			})
			.promise();

		if (!mainWalletOutput.Item) {
			const wallet = await cryptoService.createMasterWallet();
			const Item = {
				[TableKeys.PK]: Entities.MASTER_WALLET,
				[TableKeys.SK]: Entities.MASTER_WALLET,
				[MasterWalletAttributes.PRIVATE_KEY]: wallet.privateKey,
				[MasterWalletAttributes.PUBLIC_ADDRESS]: wallet.address,
				[MasterWalletAttributes.NETWORK]: 'polygon',
			};

			await dynamo
				.put({
					Item,
					TableName,

					ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
				})
				.promise();
		}
	}

	async getMasterWallet(): Promise<IMasterWallet | undefined> {
		const masterWalletOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.MASTER_WALLET,
					[TableKeys.SK]: Entities.MASTER_WALLET,
				},
			})
			.promise();
		if (masterWalletOutput.Item) {
			const masterWallet = masterWalletOutput.Item as MasterWalletItem;
			return {
				privateKey: masterWallet.privateKey,
				publicAddress: masterWallet.publicAddress,
				network: masterWallet.network,
			};
		}
		return undefined;
	}

	async getTouchPendingTransactions() {
		const output = await dynamo
			.query({
				TableName,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.TOUCH_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			return output.Items as MasterWalletInvolvedTransactionItem[];
		}
	}

	async touchUserWallet(address: string, phoneNumber: string) {
		const crypto = new CryptoService();
		const amount = '0.02';
		const transactionHash = await crypto.sendMaticToAddress(address, amount);

		await dynamo
			.put({
				Item: {
					[TableKeys.PK]: Entities.TOUCH_PENDING,
					[TableKeys.SK]: buildTouchPendingKey(transactionHash),
					[MasterWalletInvolvedTransactionAttributes.ID]: transactionHash,
					[MasterWalletInvolvedTransactionAttributes.CREATED_AT]:
						Date.now().toString(),
					[MasterWalletInvolvedTransactionAttributes.AMOUNT]: amount,
					[MasterWalletInvolvedTransactionAttributes.NETWORK]: 'polygon',
					[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]: phoneNumber,
				},
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.TOUCH_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const pusherService = new PusherService();
			pusherService.triggerTouchPendingTransactionsUpdated(
				output.Items as MasterWalletInvolvedTransactionItem[]
			);
		}
	}

	async touchUserWalletSuccess(
		transactionHash: string,
		amount: string,
		phoneNumber: string
	) {
		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Delete: {
							TableName,
							Key: {
								[TableKeys.PK]: Entities.TOUCH_PENDING,
								[TableKeys.SK]: buildTouchPendingKey(transactionHash),
							},
						},
					},
					{
						Put: {
							TableName,
							Item: {
								[TableKeys.PK]: Entities.TOUCH_SUCCESS,
								[TableKeys.SK]: buildTouchSuccessKey(transactionHash),
								[MasterWalletInvolvedTransactionAttributes.AMOUNT]: amount,
								[MasterWalletInvolvedTransactionAttributes.CREATED_AT]:
									Date.now().toString(),
								[MasterWalletInvolvedTransactionAttributes.ID]: transactionHash,
								[MasterWalletInvolvedTransactionAttributes.NETWORK]: 'polygon',
								[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]:
									phoneNumber,
							},
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();
		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.TOUCH_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const pusherService = new PusherService();
			pusherService.triggerTouchPendingTransactionsUpdated(
				output.Items as MasterWalletInvolvedTransactionItem[]
			);
		}
		await this.homeUserWallet(phoneNumber, amount);
	}

	async homeUserWallet(phoneNumber: string, amount: string) {
		const userService = new UserService();
		const cryptoService = new CryptoService();
		const wallet = await userService.getUserPolygonWallet(phoneNumber);
		const transactionHash =
			await cryptoService.makePolygonUsdtTransactionToMasterWallet(
				wallet.privateKey,
				wallet.publicKey,
				amount
			);

		await dynamo
			.put({
				TableName,
				Item: {
					[TableKeys.PK]: Entities.HOME_PENDING,
					[TableKeys.SK]: buildHomePendingKey(transactionHash),
					[MasterWalletInvolvedTransactionAttributes.AMOUNT]: amount,
					[MasterWalletInvolvedTransactionAttributes.CREATED_AT]:
						Date.now().toString(),
					[MasterWalletInvolvedTransactionAttributes.ID]: transactionHash,
					[MasterWalletInvolvedTransactionAttributes.NETWORK]: 'polygon',
					[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]: phoneNumber,
				},
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.HOME_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const pusherService = new PusherService();
			pusherService.triggerHomePendingTransactionsUpdated(
				output.Items as MasterWalletInvolvedTransactionItem[]
			);
		}
	}

	async homeUserWalletSuccess(
		transactionHash: string,
		amount: string,
		phoneNumber: string
	) {
		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Delete: {
							TableName,
							Key: {
								[TableKeys.PK]: Entities.HOME_PENDING,
								[TableKeys.SK]: buildHomePendingKey(transactionHash),
							},
						},
					},
					{
						Put: {
							TableName,
							Item: {
								[TableKeys.PK]: Entities.HOME_SUCCESS,
								[TableKeys.SK]: buildHomeSuccessKey(transactionHash),
								[MasterWalletInvolvedTransactionAttributes.AMOUNT]: amount,
								[MasterWalletInvolvedTransactionAttributes.CREATED_AT]:
									Date.now().toString(),
								[MasterWalletInvolvedTransactionAttributes.ID]: transactionHash,
								[MasterWalletInvolvedTransactionAttributes.NETWORK]: 'polygon',
								[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]:
									phoneNumber,
							},
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();

		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.HOME_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const pusherService = new PusherService();
			pusherService.triggerHomePendingTransactionsUpdated(
				output.Items as MasterWalletInvolvedTransactionItem[]
			);
		}
	}

	async withdraw(address: string, amount: string, phoneNumber: string) {
		const userKey = buildUserKey(phoneNumber);
		const userOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: userKey,
					[TableKeys.SK]: userKey,
				},
			})
			.promise();
		if (!userOutput.Item) {
			throw new Error(`user with phone number: ${phoneNumber} is not found`);
		}
		const crypto = new CryptoService();

		const transactionHash =
			await crypto.makePolygonUsdtTransactionWithdrawFromMasterWallet(
				address,
				amount
			);

		const date = Date.now().toString();

		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: Entities.WITHDRAWAL_PENDING,
								[TableKeys.SK]: buildTransactionKey(transactionHash),
								[MasterWalletInvolvedTransactionAttributes.AMOUNT]: amount,
								[MasterWalletInvolvedTransactionAttributes.CREATED_AT]:
									Date.now().toString(),
								[MasterWalletInvolvedTransactionAttributes.ID]: transactionHash,
								[MasterWalletInvolvedTransactionAttributes.NETWORK]: 'polygon',
								[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]:
									phoneNumber,
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: buildTransactionKey(transactionHash),
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
								[TransactionAttributes.ID]: transactionHash,
								[TransactionAttributes.SOURCE]: phoneNumber,
								[TransactionAttributes.STATUS]: 'pending',
								[TransactionAttributes.TARGET]: transactionHash,
								[TransactionAttributes.TYPE]: 'withdraw',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();

		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.WITHDRAWAL_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const pusherService = new PusherService();
			pusherService.triggerHomePendingTransactionsUpdated(
				output.Items as MasterWalletInvolvedTransactionItem[]
			);
		}
	}

	async withdrawSuccess(
		transactionHash: string,
		amount: string,
		phoneNumber: string
	) {
		await dynamo.transactWrite({
			TransactItems: [
				{
					Delete: {
						TableName,
						Key: {
							[TableKeys.PK]: Entities.WITHDRAWAL_PENDING,
							[TableKeys.SK]: buildWithdrawalPendingKey(transactionHash),
						},
					},
				},
				{
					Put: {
						TableName,
						Item: {
							[TableKeys.PK]: Entities.WITHDRAWAL_SUCCESS,
							[TableKeys.SK]: buildWithdrawalSuccessKey(transactionHash),
							[MasterWalletInvolvedTransactionAttributes.AMOUNT]: amount,
							[MasterWalletInvolvedTransactionAttributes.CREATED_AT]:
								Date.now().toString(),
							[MasterWalletInvolvedTransactionAttributes.ID]: transactionHash,
							[MasterWalletInvolvedTransactionAttributes.NETWORK]: 'polygon',
							[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]:
								phoneNumber,
						},
						ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
					},
				},
			],
		});

		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.WITHDRAWAL_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const pusherService = new PusherService();
			pusherService.triggerHomePendingTransactionsUpdated(
				output.Items as MasterWalletInvolvedTransactionItem[]
			);
		}
	}
}
