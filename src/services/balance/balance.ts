import {
	buildDecrementTransactionKey,
	buildIncrementTransactionKey,
	buildTransactionKey,
	buildUserKey,
} from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import {
	DecrementTransactionAttributes,
	IncrementTransactionAttributes,
	TableKeys,
	TransactionAttributes,
	Entities,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamo = new DynamoMainTable();
const tableName = process.env.dynamo_table as string;

export interface MakeTransactionProps {
	sourceId: string;
	targetId: string;
}

export default class BalanceService {
	async incrementBalance(phoneNumber: string, amount: number, hash: string) {
		const incrementTransactionOutput = await dynamo.getItem({
			[TableKeys.PK]: Entities.INCREMENT_TRANSACTION,
			[TableKeys.SK]: buildIncrementTransactionKey(hash),
		});

		if (incrementTransactionOutput.Item) {
			throw new Error(`Increment transaction with hash ${hash} already exist`);
		}
		const userKey = buildUserKey(phoneNumber);
		const transactionId = v4();
		const transactionKey = buildTransactionKey(transactionId);
		const transactionHashKey = buildIncrementTransactionKey(hash);
		const date = Date.now().toString();
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: Entities.INCREMENT_TRANSACTION,
								[TableKeys.SK]: transactionHashKey,
								[IncrementTransactionAttributes.ID]: hash,
								[IncrementTransactionAttributes.PHONE_NUMBER]: phoneNumber,
								[IncrementTransactionAttributes.AMOUNT]: amount,
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: transactionKey,
								[TransactionAttributes.ID]: transactionId,
								[TransactionAttributes.SOURCE]: phoneNumber,
								[TransactionAttributes.TARGET]: phoneNumber,
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
								[TransactionAttributes.STATUS]: 'success',
								[TransactionAttributes.TYPE]: 'deposit',
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Update: {
							TableName: tableName,
							Key: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: userKey,
							},
							UpdateExpression: `SET #balance = #balance + :increase`,
							ExpressionAttributeNames: {
								'#balance': 'balance',
							},
							ExpressionAttributeValues: {
								':increase': amount,
							},
						},
					},
				],
			})
			.promise();
	}

	async decrementBalance(phoneNumber: string, amount: number, hash: string) {
		const decrementTransactionOutput = await dynamo.getItem({
			[TableKeys.PK]: Entities.DECREMENT_TRANSACTION,
			[TableKeys.SK]: buildDecrementTransactionKey(hash),
		});

		if (decrementTransactionOutput.Item) {
			throw new Error(`Decrement transaction with hash ${hash} already exist`);
		}

		const userKey = buildUserKey(phoneNumber);
		const transactionId = v4();
		const transactionKey = buildTransactionKey(transactionId);
		const date = Date.now().toString();
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: Entities.DECREMENT_TRANSACTION,
								[TableKeys.SK]: buildDecrementTransactionKey(hash),
								[DecrementTransactionAttributes.ID]: hash,
								[DecrementTransactionAttributes.PHONE_NUMBER]: phoneNumber,
								[DecrementTransactionAttributes.AMOUNT]: amount,
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: transactionKey,
								[TransactionAttributes.ID]: transactionId,
								[TransactionAttributes.SOURCE]: phoneNumber,
								[TransactionAttributes.TARGET]: phoneNumber,
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
								[TransactionAttributes.STATUS]: '',
								[TransactionAttributes.TYPE]: 'withdraw',
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Update: {
							TableName: tableName,
							Key: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: userKey,
							},
							UpdateExpression: `SET #balance = #balance + :increase`,
							ExpressionAttributeNames: {
								'#balance': 'balance',
							},
							ExpressionAttributeValues: {
								':increase': amount,
							},
						},
					},
				],
			})
			.promise();
	}
}
