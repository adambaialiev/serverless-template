import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { Entities, TableKeys } from '@/common/dynamo/schema';
import { buildAssistantKey } from '@/common/dynamo/buildKey';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	const { ids } = JSON.parse(event.body);
	try {
		const Keys = ids.map((id: string) => ({
			[TableKeys.PK]: Entities.ASSISTANT,
			[TableKeys.SK]: buildAssistantKey(id),
		}));
		const response = await dynamo
			.batchGet({
				RequestItems: {
					[TableName]: { Keys },
				},
			})
			.promise();

		const result = response.Responses[TableName];

		return sendResponse(200, result);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
