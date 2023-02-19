import {
	buildTransactionKey,
	buildUserKey,
	buildTransactionRequestKey,
} from '@/common/dynamo/buildKey';
import {
	TableKeys,
	TransactionAttributes,
	TransactionRequestAttributes,
	TransactionRequestItem,
	Entities,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';
import { UserSlug } from '../user/types';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export class TransactionService {
	async getTransactions(phoneNumber: string) {
		const userKey = buildUserKey(phoneNumber);

		const params = {
			TableName,
			KeyConditionExpression: `#pk = :pk AND begins_with(#sk, :sk)`,
			FilterExpression: 'phoneNumber <> :phoneNumber',
			ExpressionAttributeNames: {
				'#pk': TableKeys.PK,
				'#sk': TableKeys.SK,
			},
			ExpressionAttributeValues: {
				':pk': userKey,
				':sk': Entities.TRANSACTION,
				':phoneNumber': phoneNumber,
			},
			ScanIndexForward: false,
		};

		return dynamoDB.query(params).promise();
	}
	async getTransactionsRoom(source: string, target: string) {
		const userKey = buildUserKey(source);

		const params = {
			TableName,
			KeyConditionExpression: `#pk = :pk`,
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
								[TransactionAttributes.DATE]: date,
								[TransactionAttributes.STATUS]: status,
								[TransactionAttributes.TYPE]: 'out',
							},
							TableName,
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
								[TransactionAttributes.DATE]: date,
								[TransactionAttributes.STATUS]: status,
								[TransactionAttributes.TYPE]: 'in',
							},
							TableName,
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Update: {
							TableName,
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
							TableName,
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
	async request(
		source: string,
		target: string,
		amount: number,
		comment: string
	) {
		const transactionRequestId = v4();

		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							TableName,
							Item: {
								[TableKeys.PK]: buildUserKey(source),
								[TableKeys.SK]:
									buildTransactionRequestKey(transactionRequestId),
								[TransactionRequestAttributes.AMOUNT]: amount,
								[TransactionRequestAttributes.COMMENT]: comment ?? '',
								[TransactionRequestAttributes.SOURCE]: source,
								[TransactionRequestAttributes.TARGET]: target,
								[TransactionRequestAttributes.ID]: v4(),
								[TransactionRequestAttributes.CREATED_AT]:
									Date.now().toString(),
								[TransactionRequestAttributes.STATUS]: 'pending',
								[TransactionRequestAttributes.TYPE]: 'sender',
								[TransactionRequestAttributes.UPDATED_AT]: '',
							},
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
					{
						Put: {
							TableName,
							Item: {
								[TableKeys.PK]: buildUserKey(target),
								[TableKeys.SK]:
									buildTransactionRequestKey(transactionRequestId),
								[TransactionRequestAttributes.AMOUNT]: amount,
								[TransactionRequestAttributes.COMMENT]: comment ?? '',
								[TransactionRequestAttributes.SOURCE]: source,
								[TransactionRequestAttributes.TARGET]: target,
								[TransactionRequestAttributes.ID]: v4(),
								[TransactionRequestAttributes.CREATED_AT]:
									Date.now().toString(),
								[TransactionRequestAttributes.STATUS]: 'pending',
								[TransactionRequestAttributes.TYPE]: 'receiver',
								[TransactionRequestAttributes.UPDATED_AT]: '',
							},
							ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
						},
					},
				],
			})
			.promise();
		return 'Success';
	}

	async acceptRequest(source: string, target: string, id: string) {
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: buildUserKey(source),
								[TableKeys.SK]: buildTransactionRequestKey(id),
							},
							UpdateExpression:
								'SET #status = :accepted, #updatedAt = :updatedAt',
							ConditionExpression: 'contains(#status, :pending)',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionRequestAttributes.UPDATED_AT,
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
								[TableKeys.SK]: buildTransactionRequestKey(id),
							},
							UpdateExpression:
								'SET #status = :accepted, #updatedAt = :updatedAt',
							ConditionExpression: 'contains(#status, :pending)',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionRequestAttributes.UPDATED_AT,
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
	async declineRequest(source: string, target: string, id: string) {
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Update: {
							TableName,
							Key: {
								[TableKeys.PK]: buildUserKey(source),
								[TableKeys.SK]: buildTransactionRequestKey(id),
							},
							UpdateExpression:
								'SET #status = :declined, #updatedAt = :updatedAt',
							ConditionExpression: 'contains(#status, :pending)',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionRequestAttributes.UPDATED_AT,
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
								[TableKeys.SK]: buildTransactionRequestKey(id),
							},
							UpdateExpression:
								'SET #status = :declined, #updatedAt = :updatedAt',
							ConditionExpression: 'contains(#status, :pending)',
							ExpressionAttributeNames: {
								'#status': 'status',
								'#updatedAt': TransactionRequestAttributes.UPDATED_AT,
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
	async getRequest(phoneNumber: string) {
		return (
			await dynamoDB
				.get({
					TableName,
					Key: {
						[TableKeys.PK]: buildUserKey(phoneNumber),
						[TableKeys.SK]: buildTransactionRequestKey(phoneNumber),
					},
				})
				.promise()
		).Item as TransactionRequestItem;
	}
}
