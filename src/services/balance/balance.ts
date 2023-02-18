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
import { UserSlug } from '@/services/user/types';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamo = new DynamoMainTable();
const tableName = process.env.dynamo_table as string;

export interface MakeTransactionProps {
	sourceId: string;
	targetId: string;
}

interface IncrementBalanceProps {
	phoneNumber: string;
	amount: number;
	hash: string;
	address: string;
}

export default class BalanceService {
	async incrementBalance({
		phoneNumber,
		amount,
		hash,
		address,
	}: IncrementBalanceProps) {
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
								[IncrementTransactionAttributes.CREATED_AT]: date,
								[IncrementTransactionAttributes.ADDRESS]: address,
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
								[TransactionAttributes.CREATED_AT]: date,
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
								[TransactionAttributes.CREATED_AT]: date,
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

	async getTransactions(phoneNumber: string) {
		const userKey = buildUserKey(phoneNumber);

		const params = {
			TableName: tableName,
			KeyConditionExpression: '#pk = :pk',
			FilterExpression: 'phoneNumber <> :phoneNumber',
			ExpressionAttributeNames: {
				'#pk': TableKeys.PK,
			},
			ExpressionAttributeValues: {
				':pk': userKey,
				':phoneNumber': phoneNumber,
			},
			ScanIndexForward: false,
		};

		return dynamoDB.query(params).promise();
	}
	async getTransactionsRoom(source: string, target: string) {
		const userKey = buildUserKey(source);

		const params = {
			TableName: tableName,
			KeyConditionExpression: '#pk = :pk',
			FilterExpression:
				'(phoneNumber <> :source) AND ((#source = :source AND #target = :target) OR (#source = :target AND #target = :source))',
			ExpressionAttributeNames: {
				'#pk': TableKeys.PK,
				'#source': 'source',
				'#target': 'target',
			},
			ExpressionAttributeValues: {
				':pk': userKey,
				':source': source,
				':target': target,
			},
			ScanIndexForward: false,
		};

		return dynamoDB.query(params).promise();
	}
	async makeTransaction(
		source: UserSlug,
		target: UserSlug,
		amount: number,
		comment?: string
	) {
		const sourceUserKey = buildUserKey(source.phoneNumber);
		const targetUserKey = buildUserKey(target.phoneNumber);

		const sourceTransactionId = v4();
		const targetTransactionId = v4();

		const sourceTransactionKey = buildTransactionKey(sourceTransactionId);
		const targetTransactionKey = buildTransactionKey(targetTransactionId);

		const date = Date.now().toString();
		const status = '';

		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: sourceUserKey,
								[TableKeys.SK]: sourceTransactionKey,
								[TransactionAttributes.ID]: sourceTransactionId,
								[TransactionAttributes.SOURCE]: source.phoneNumber,
								[TransactionAttributes.TARGET]: target.phoneNumber,
								[TransactionAttributes.COMMENT]: comment ?? '',
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.STATUS]: status,
								[TransactionAttributes.TYPE]: 'out',
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: targetUserKey,
								[TableKeys.SK]: targetTransactionKey,
								[TransactionAttributes.ID]: targetTransactionId,
								[TransactionAttributes.SOURCE]: source.phoneNumber,
								[TransactionAttributes.TARGET]: target.phoneNumber,
								[TransactionAttributes.COMMENT]: comment ?? '',
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.STATUS]: status,
								[TransactionAttributes.TYPE]: 'in',
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Update: {
							TableName: tableName,
							Key: {
								[TableKeys.PK]: sourceUserKey,
								[TableKeys.SK]: sourceUserKey,
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
							TableName: tableName,
							Key: {
								[TableKeys.PK]: targetUserKey,
								[TableKeys.SK]: targetUserKey,
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
		return true;
	}
}
