import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { TableKeys } from '@/common/dynamo/schema';
import { buildAssistantKey } from '@/common/dynamo/buildKey';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	const { assistantId } = event.pathParameters;
	try {
		const queryOutput = await dynamo
			.query({
				TableName,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': buildAssistantKey(assistantId),
				},
				ScanIndexForward: false,
			})
			.promise();

		return sendResponse(200, queryOutput.Items);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
