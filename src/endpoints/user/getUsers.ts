import AWS from 'aws-sdk';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.dynamo_table as string;

export const getUsers = async (event: APIGatewayEvent) => {
	try {
		const { phoneNumbers } = JSON.parse(event.body as string);

		const params = {
			RequestItems: {
				[tableName]: {
					Keys: phoneNumbers.map((item: string) => ({
						PK: `USER#${item}`,
						SK: `USER#${item}`,
					})),
				},
			},
		};

		const usersOutput = await dynamoDB.batchGet(params).promise();
		return sendResponse(200, usersOutput.Responses[tableName]);
	} catch (error) {
		const message = error.message ? error.message : 'Internal server error';
		return sendResponse(500, { message });
	}
};
