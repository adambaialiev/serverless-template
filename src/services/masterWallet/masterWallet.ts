import {
	buildDecrementTransactionKey,
	buildDepositToValidateKey,
	buildTransactionKey,
	buildUserKey,
	buildWithdrawToProcessKey,
} from '@/common/dynamo/buildKey';
import {
	DecrementTransactionAttributes,
	DepositToValidateAttributes,
	DepositToValidateItem,
	Entities,
	MasterWalletAttributes,
	MasterWalletItem,
	TableKeys,
	TransactionAttributes,
	WithdrawToProcessAttributes,
	WithdrawToProcessItem,
} from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';
import AWS from 'aws-sdk';

interface TransactionToProcessProps {
	amount: string;
	phoneNumber: string;
	address: string;
	hash: string;
}

interface DepositToValidateProps {
	amount: string;
	phoneNumber: string;
	address: string;
	hash: string;
	blockNum: string;
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
				[MasterWalletAttributes.PUBLIC_ADDRESS]: wallet.address.toLowerCase(),
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

	async updateDepositValidationValue(
		phoneNumber: string,
		hash: string,
		validationNumber: string
	) {
		await dynamo
			.update({
				TableName,
				Key: {
					[TableKeys.PK]: buildUserKey(phoneNumber),
					[TableKeys.SK]: buildTransactionKey(hash),
				},
				UpdateExpression: `SET #validationNumber = :validationNumber`,
				ExpressionAttributeNames: {
					'#validationNumber': 'validationNumber',
				},
				ExpressionAttributeValues: {
					':validationNumber': validationNumber,
				},
			})
			.promise();
	}

	async createDepositToValidate({
		amount,
		phoneNumber,
		address,
		hash,
		blockNum,
	}: DepositToValidateProps) {
		console.log({ amount, phoneNumber, address, hash, blockNum });
		const depositToValidateOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.DEPOSIT_TO_VALIDATE,
					[TableKeys.SK]: buildDepositToValidateKey(hash),
				},
			})
			.promise();

		if (depositToValidateOutput.Item) {
			throw new Error(`Deposit to validate with hash ${hash} already exist`);
		}

		const date = Date.now().toString();

		const userKey = buildUserKey(phoneNumber);

		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: Entities.DEPOSIT_TO_VALIDATE,
								[TableKeys.SK]: buildDepositToValidateKey(hash),
								[DepositToValidateAttributes.ADDRESS]: address,
								[DepositToValidateAttributes.AMOUNT]: amount,
								[DepositToValidateAttributes.CREATED_AT]: date,
								[DepositToValidateAttributes.ID]: hash,
								[DepositToValidateAttributes.NETWORK]: 'polygon',
								[DepositToValidateAttributes.PHONE_NUMBER]: phoneNumber,
								[DepositToValidateAttributes.BLOCK_NUMBER]: blockNum,
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: buildTransactionKey(hash),
								[TransactionAttributes.ID]: hash,
								[TransactionAttributes.SOURCE]: phoneNumber,
								[TransactionAttributes.TARGET]: phoneNumber,
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.STATUS]: 'validating',
								[TransactionAttributes.TYPE]: 'deposit',
								[TransactionAttributes.VALIDATION_NUMBER]: '1/128',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();
	}

	async getDepositsToValidate(): Promise<DepositToValidateItem[] | undefined> {
		const output = await dynamo
			.query({
				TableName: process.env.dynamo_table,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.DEPOSIT_TO_VALIDATE,
				},
			})
			.promise();

		if (output.Items) {
			return output.Items as DepositToValidateItem[];
		}
		return undefined;
	}

	async createWithdrawToProcess({
		amount,
		phoneNumber,
		address,
		hash,
	}: TransactionToProcessProps) {
		console.log({ amount, phoneNumber, address, hash });
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

		await dynamo
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: buildTransactionKey(hash),
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.ID]: hash,
								[TransactionAttributes.SOURCE]: phoneNumber,
								[TransactionAttributes.STATUS]: 'pending',
								[TransactionAttributes.TARGET]: '',
								[TransactionAttributes.TYPE]: 'withdraw',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: buildWithdrawToProcessKey(hash),
								[TableKeys.SK]: buildWithdrawToProcessKey(hash),
								[WithdrawToProcessAttributes.ADDRESS]: address,
								[WithdrawToProcessAttributes.AMOUNT]: amount,
								[WithdrawToProcessAttributes.CREATED_AT]: date,
								[WithdrawToProcessAttributes.ID]: hash,
								[WithdrawToProcessAttributes.NETWORK]: 'polygon',
								[WithdrawToProcessAttributes.PHONE_NUMBER]: phoneNumber,
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();
	}

	async withdrawSuccess(transactionHash: string) {
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
		const withdrawToProcessOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: buildWithdrawToProcessKey(transactionHash),
					[TableKeys.SK]: buildWithdrawToProcessKey(transactionHash),
				},
			})
			.promise();

		if (!withdrawToProcessOutput.Item) {
			throw new Error('No withdraw to process item found');
		}
		const withdrawToProcess =
			withdrawToProcessOutput.Item as WithdrawToProcessItem;
		console.log({ withdrawToProcess });
		const { amount, address, phoneNumber } = withdrawToProcess;
		const userKey = buildUserKey(phoneNumber);
		console.log({ userKey });
		await dynamo
			.transactWrite({
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
						Delete: {
							TableName,
							Key: {
								[TableKeys.PK]: buildWithdrawToProcessKey(transactionHash),
								[TableKeys.SK]: buildWithdrawToProcessKey(transactionHash),
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
								':decrease': Number(amount),
							},
						},
					},
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: buildTransactionKey(transactionHash),
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
			})
			.promise();

		const userService = new UserService();
		const pushNotificationService = new PushNotifications();

		const userOutput = await userService.getSlug(phoneNumber);

		try {
			if (userOutput.pushToken) {
				await pushNotificationService.send(
					userOutput.pushToken,
					`Withdrawal successful: ${amount} USDT`,
					userOutput.unreadNotifications
				);
			}
		} catch (error) {
			console.log({ error });
		}
	}
}
