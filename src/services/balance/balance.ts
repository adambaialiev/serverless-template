import {
	buildDepositToValidateKey,
	buildIncrementTransactionKey,
	buildTransactionKey,
	buildUserKey,
} from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import {
	IncrementTransactionAttributes,
	TableKeys,
	Entities,
	IncrementTransactionItem,
	DecrementTransactionItem,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';

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
	async getIncrementTransactions() {
		const output = await dynamoDB
			.query({
				TableName: process.env.dynamo_table,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.INCREMENT_TRANSACTION,
				},
			})
			.promise();

		if (output.Items) {
			const items = output.Items as IncrementTransactionItem[];
			return items;
		}
	}

	async getDecrementTransactions() {
		const output = await dynamoDB
			.query({
				TableName: process.env.dynamo_table,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.DECREMENT_TRANSACTION,
				},
			})
			.promise();

		if (output.Items) {
			const items = output.Items as DecrementTransactionItem[];
			return items;
		}
	}

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
		const date = Date.now().toString();
		await dynamoDB
			.transactWrite({
				TransactItems: [
					{
						Put: {
							Item: {
								[TableKeys.PK]: Entities.INCREMENT_TRANSACTION,
								[TableKeys.SK]: buildIncrementTransactionKey(hash),
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
					{
						Update: {
							TableName: tableName,
							Key: {
								[TableKeys.PK]: userKey,
								[TableKeys.SK]: buildTransactionKey(hash),
							},
							UpdateExpression: `SET #status = :status, #validationNumber = :validationNumber`,
							ExpressionAttributeNames: {
								'#status': 'status',
								'#validationNumber': 'validationNumber',
							},
							ExpressionAttributeValues: {
								':status': 'success',
								':validationNumber': '128/128',
							},
						},
					},
					{
						Delete: {
							TableName: tableName,
							Key: {
								[TableKeys.PK]: Entities.DEPOSIT_TO_VALIDATE,
								[TableKeys.SK]: buildDepositToValidateKey(hash),
							},
						},
					},
				],
			})
			.promise();
	}
}
