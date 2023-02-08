import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import {
	Entities,
	MasterWalletTransactionAttributes,
	MasterWalletTransactionItem,
	TableKeys,
} from '@/common/dynamo/schema';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const dynamoDb = new DocumentClient();

export const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const output = await dynamoDb
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: '#pk = :pk',
				FilterExpression: '#status = :status',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
					'#status': MasterWalletTransactionAttributes.STATUS,
				},
				ExpressionAttributeValues: {
					':pk': Entities.MASTER_WALLET_TRANSACTION,
					':status': 'pending',
				},
			})
			.promise();
		console.log({ output });
		if (output.Items) {
			const transactions = output.Items as MasterWalletTransactionItem[];
			callback(null, {
				statusCode: 201,
				body: JSON.stringify(transactions),
			});
		} else {
			return {
				statusCode: 500,
				body: 'no users',
			};
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const getPendingMasterWalletTransactions = handler;
