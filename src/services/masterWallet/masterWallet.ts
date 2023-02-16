import {
	buildDecrementTransactionKey,
	buildTransactionKey,
	buildUserKey,
	buildWithdrawalPendingKey,
	buildWithdrawalSuccessKey,
} from '@/common/dynamo/buildKey';
import {
	DecrementTransactionAttributes,
	Entities,
	MasterWalletAttributes,
	MasterWalletItem,
	TableKeys,
	TransactionAttributes,
	WithdrawalTransactionAttributes,
	WithdrawalTransactionItem,
} from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import CryptoEthersService, {
	amountToRaw,
} from '@/services/crypto/cryptoEthers';
import PusherService from '@/services/pusher/pusher';
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

	async withdraw(address: string, amount: string, phoneNumber: string) {
		console.log({ amount });
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
		const crypto = new CryptoEthersService();

		const masterWallet = await this.getMasterWallet();

		if (!masterWallet) {
			throw new Error('can not find master wallet');
		}

		const rawAmount = amountToRaw(Number(amount));

		console.log({ rawAmount });

		const transactionHash = await crypto.makePolygonUsdtTransaction(
			masterWallet.privateKey,
			address,
			rawAmount
		);

		console.log({ transactionHash });

		const date = Date.now().toString();

		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: Entities.WITHDRAWAL_PENDING,
								[TableKeys.SK]: buildTransactionKey(transactionHash),
								[WithdrawalTransactionAttributes.AMOUNT]: amount,
								[WithdrawalTransactionAttributes.CREATED_AT]:
									Date.now().toString(),
								[WithdrawalTransactionAttributes.ID]: transactionHash,
								[WithdrawalTransactionAttributes.NETWORK]: 'polygon',
								[WithdrawalTransactionAttributes.PHONE_NUMBER]: phoneNumber,
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
								[TransactionAttributes.CREATED_AT]: date,
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
			await pusherService.triggerWithdrawalPendingTransactionsUpdated(
				output.Items as WithdrawalTransactionItem[]
			);
		}
	}

	async withdrawSuccess(
		transactionHash: string,
		amount: string,
		phoneNumber: string
	) {
		const decrementTransactionOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.DECREMENT_TRANSACTION,
					[TableKeys.SK]: buildDecrementTransactionKey(transactionHash),
				},
			})
			.promise();

		if (decrementTransactionOutput.Item) {
			throw new Error(
				`Decrement transaction with hash ${transactionHash} already exist`
			);
		}
		const userKey = buildUserKey(phoneNumber);
		await dynamo.transactWrite({
			TransactItems: [
				{
					Put: {
						TableName,
						Item: {
							[TableKeys.PK]: Entities.DECREMENT_TRANSACTION,
							[TableKeys.SK]: buildDecrementTransactionKey(transactionHash),
							[DecrementTransactionAttributes.ID]: transactionHash,
							[DecrementTransactionAttributes.PHONE_NUMBER]: phoneNumber,
							[DecrementTransactionAttributes.AMOUNT]: amount,
						},
					},
				},
				{
					Update: {
						TableName,
						Key: {
							[TableKeys.PK]: userKey,
							[TableKeys.SK]: userKey,
						},
						UpdateExpression: `SET #balance = #balance - :decrease`,
						ExpressionAttributeNames: {
							'#balance': 'balance',
						},
						ExpressionAttributeValues: {
							':decrease': amount,
						},
					},
				},
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
							[WithdrawalTransactionAttributes.AMOUNT]: amount,
							[WithdrawalTransactionAttributes.CREATED_AT]:
								Date.now().toString(),
							[WithdrawalTransactionAttributes.ID]: transactionHash,
							[WithdrawalTransactionAttributes.NETWORK]: 'polygon',
							[WithdrawalTransactionAttributes.PHONE_NUMBER]: phoneNumber,
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
			await pusherService.triggerWithdrawalPendingTransactionsUpdated(
				output.Items as WithdrawalTransactionItem[]
			);
		}
	}
}
