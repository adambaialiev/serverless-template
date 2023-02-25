import {
	buildDecrementTransactionKey,
	buildTransactionKey,
	buildUserKey,
} from '@/common/dynamo/buildKey';
import {
	DecrementTransactionAttributes,
	Entities,
	MasterWalletAttributes,
	MasterWalletItem,
	TableKeys,
	TransactionAttributes,
} from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import PusherService from '@/services/pusher/pusher';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';

interface WithdrawToProcessProps {
	amount: string;
	phoneNumber: string;
	address: string;
}

interface WithdrawSuccessProps {
	transactionHash: string;
	transactionId: string;
	amount: string;
	phoneNumber: string;
	address: string;
}

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export interface IMasterWallet {
	publicAddress: string;
	privateKey: string;
	network: string;
	phoneNumber: string;
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
				phoneNumber: '',
			};
		}
		return undefined;
	}

	async createWithdrawToProcess({
		amount,
		phoneNumber,
		address,
	}: WithdrawToProcessProps) {
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

		const date = Date.now().toString();

		const transactionId = v4();

		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: buildTransactionKey(transactionId),
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.ID]: transactionId,
								[TransactionAttributes.SOURCE]: phoneNumber,
								[TransactionAttributes.STATUS]: 'pending',
								[TransactionAttributes.TARGET]: '',
								[TransactionAttributes.TYPE]: 'withdraw',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();

		const pusherService = new PusherService();
		await pusherService.triggerWithdrawalToProcess({
			id: transactionId,
			createdAt: date,
			amount,
			phoneNumber,
			address,
		});
	}

	async withdrawSuccess({
		transactionHash,
		transactionId,
		amount,
		phoneNumber,
		address,
	}: WithdrawSuccessProps) {
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
							[DecrementTransactionAttributes.ADDRESS]: address,
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
					Update: {
						TableName,
						Key: {
							[TableKeys.PK]: userKey,
							[TableKeys.SK]: buildTransactionKey(transactionId),
						},
						UpdateExpression: `SET #status = :status`,
						ExpressionAttributeNames: {
							'#status': 'status',
						},
						ExpressionAttributeValues: {
							':status': 'success',
						},
					},
				},
			],
		});
	}
}
