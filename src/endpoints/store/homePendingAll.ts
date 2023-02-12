import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import {
	Entities,
	MasterWalletInvolvedTransactionItem,
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
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.HOME_PENDING,
				},
			})
			.promise();

		if (output.Items) {
			const transactions =
				output.Items as MasterWalletInvolvedTransactionItem[];
			callback(null, {
				statusCode: 201,
				body: JSON.stringify(transactions),
			});
		} else {
			return {
				statusCode: 500,
				body: 'no transactions',
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

export const homePendingAll = handler;
