import AWS from 'aws-sdk';
import { TableKeys, TransactionAttributes } from '@/common/dynamo/schema';
import { v4 } from 'uuid';
import { buildUserKey, buildTransactionKey } from '@/common/dynamo/buildKey';

interface ICreateRequestParams {
	amount: number;
	comment?: string;
	target: string;
	source: string;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export class TransactionRequestService {
	async request({ amount, source, target, comment }: ICreateRequestParams) {
		const transactionId = v4();
		const date = Date.now().toString();

		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: buildUserKey(source),
								[TableKeys.SK]: buildTransactionKey(transactionId),
								[TransactionAttributes.ID]: transactionId,
								[TransactionAttributes.SOURCE]: source,
								[TransactionAttributes.TARGET]: target,
								[TransactionAttributes.COMMENT]: comment ?? '',
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.UPDATED_AT]: '',
								[TransactionAttributes.STATUS]: 'pending',
								[TransactionAttributes.TYPE]: 'request',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							Item: {
								[TableKeys.PK]: buildUserKey(target),
								[TableKeys.SK]: buildTransactionKey(transactionId),
								[TransactionAttributes.ID]: transactionId,
								[TransactionAttributes.SOURCE]: source,
								[TransactionAttributes.TARGET]: target,
								[TransactionAttributes.COMMENT]: comment ?? '',
								[TransactionAttributes.AMOUNT]: amount,
								[TransactionAttributes.IS_READ]: false,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.UPDATED_AT]: '',
								[TransactionAttributes.STATUS]: 'pending',
								[TransactionAttributes.TYPE]: 'request',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();
		return true;
	}
	async accept(source: string, target: string, id: string) {
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: buildUserKey(source),
								[TableKeys.SK]: buildTransactionKey(id),
							},
							UpdateExpression:
								'SET #status = :accepted, #updatedAt = :updatedAt',
							ConditionExpression: '#status = :pending',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionAttributes.UPDATED_AT,
							},
							ExpressionAttributeValues: {
								':accepted': 'accepted',
								':pending': 'pending',
								':updatedAt': Date.now().toString(),
							},
						},
					},
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: buildUserKey(target),
								[TableKeys.SK]: buildTransactionKey(id),
							},
							UpdateExpression:
								'SET #status = :accepted, #updatedAt = :updatedAt',
							ConditionExpression: '#status = :pending',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionAttributes.UPDATED_AT,
							},
							ExpressionAttributeValues: {
								':accepted': 'accepted',
								':pending': 'pending',
								':updatedAt': Date.now().toString(),
							},
						},
					},
				],
			})
			.promise();
		return 'Success';
	}
	async decline(source: string, target: string, id: string) {
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: buildUserKey(source),
								[TableKeys.SK]: buildTransactionKey(id),
							},
							UpdateExpression:
								'SET #status = :declined, #updatedAt = :updatedAt',
							ConditionExpression: '#status = :pending',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionAttributes.UPDATED_AT,
							},
							ExpressionAttributeValues: {
								':declined': 'declined',
								':pending': 'pending',
								':updatedAt': Date.now().toString(),
							},
						},
					},
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: buildUserKey(target),
								[TableKeys.SK]: buildTransactionKey(id),
							},
							UpdateExpression:
								'SET #status = :declined, #updatedAt = :updatedAt',
							ConditionExpression: '#status = :pending',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionAttributes.UPDATED_AT,
							},
							ExpressionAttributeValues: {
								':declined': 'declined',
								':pending': 'pending',
								':updatedAt': Date.now().toString(),
							},
						},
					},
				],
			})
			.promise();
		return 'Success';
	}
}
