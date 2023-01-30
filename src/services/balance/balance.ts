import {
	buildTransactionKey,
	buildUserKey,
	buildPreTransactionKey,
} from '@/common/dynamo/buildKey';
import { TableKeys, TransactionAttributes } from '@/common/dynamo/schema';
import { UserSlug } from '@/services/user/types';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.dynamo_table as string;

export interface MakeTransactionProps {
	sourceId: string;
	targetId: string;
}

export default class BalanceService {
	async preTransaction(source: UserSlug, target: UserSlug, amount: number) {
		if (Number(source.balance) < Number(amount)) {
			return {
				statusCode: 400,
				body: 'you don`t have enough money',
			};
		}

		const sourceUserKey = buildUserKey(source.phoneNumber);
		const targetUserKey = buildUserKey(target.phoneNumber);

		const sourceTransactionId = source.phoneNumber;
		const targetTransactionId = target.phoneNumber;

		console.log({
			sourceUserKey,
			targetUserKey,
			sourceTransactionId,
			targetTransactionId,
			amount,
			source,
			target,
			tableName,
		});

		const sourcePreTransactionKey = buildPreTransactionKey(sourceTransactionId);
		const targetPreTransactionKey = buildPreTransactionKey(targetTransactionId);

		const date = Date.now().toString();
		const status = 'pending';

		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: sourceUserKey,
								[TableKeys.SK]: sourcePreTransactionKey,
								[TransactionAttributes.ID]: sourceTransactionId,
								[TransactionAttributes.SOURCE]: source.phoneNumber,
								[TransactionAttributes.TARGET]: target.phoneNumber,
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
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
								[TableKeys.SK]: targetPreTransactionKey,
								[TransactionAttributes.ID]: targetTransactionId,
								[TransactionAttributes.SOURCE]: source.phoneNumber,
								[TransactionAttributes.TARGET]: target.phoneNumber,
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
								[TransactionAttributes.STATUS]: status,
								[TransactionAttributes.TYPE]: 'in',
							},
							TableName: tableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();
		return true;
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
	async makeTransaction(source: UserSlug, target: UserSlug, amount: number) {
		if (Number(source.balance) < Number(amount)) {
			return {
				statusCode: 400,
				body: 'you don`t have enough money',
			};
		}

		const sourceUserKey = buildUserKey(source.phoneNumber);
		const targetUserKey = buildUserKey(target.phoneNumber);

		const sourceTransactionId = v4();
		const targetTransactionId = v4();

		console.log({
			sourceUserKey,
			targetUserKey,
			sourceTransactionId,
			targetTransactionId,
			amount,
			source,
			target,
			tableName,
		});

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
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
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
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.DATE]: date,
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
