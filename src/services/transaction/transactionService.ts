import { buildTransactionKey, buildUserKey } from '@/common/dynamo/buildKey';
import {
	TableKeys,
	TransactionAttributes,
	Entities,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';
import { ITransactionCreateParams } from './transactions.types';
import { ITransaction } from '../../common/dynamo/schema';

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
	async updateIsReadState(phoneNumber: string, transactionId: string) {
		const params = {
			TableName,
			Key: {
				[TableKeys.PK]: buildUserKey(phoneNumber),
				[TableKeys.SK]: buildTransactionKey(transactionId),
			},
			UpdateExpression: 'SET #isRead = :isRead',
			ExpressionAttributeNames: {
				'#isRead': 'isRead',
			},
			ExpressionAttributeValues: {
				':isRead': true,
			},
			ReturnValues: 'ALL_NEW',
		};

		return dynamoDB.update(params).promise();
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

		return (await dynamoDB.query(params).promise()).Items as ITransaction[];
	}
	async makeTransaction({
		source,
		target,
		amount,
		comment,
	}: ITransactionCreateParams) {
		const sourceUserKey = buildUserKey(source.phoneNumber);
		const targetUserKey = buildUserKey(target.phoneNumber);

		const sourceTransactionId = v4();
		const targetTransactionId = v4();

		const sourceTransactionKey = buildTransactionKey(sourceTransactionId);
		const targetTransactionKey = buildTransactionKey(targetTransactionId);

		const date = Date.now().toString();

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
								[TransactionAttributes.TYPE]: 'transaction',
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
								[TransactionAttributes.IS_READ]: false,
								[TransactionAttributes.CREATED_AT]: date,
								[TransactionAttributes.TYPE]: 'transaction',
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
}
