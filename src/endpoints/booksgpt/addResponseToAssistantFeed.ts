import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { AssistantResponseAttributes, TableKeys } from '@/common/dynamo/schema';
import {
	buildAssistantKey,
	buildAssistantResponseKey,
} from '@/common/dynamo/buildKey';
import KSUID from 'ksuid';
import { getName } from 'country-list';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { assistantId } = event.pathParameters;
		const { prompt, response, messageId } = JSON.parse(event.body);

		const id = KSUID.randomSync().string;

		const countryCode = event.headers['CloudFront-Viewer-Country'];

		const country = getName(countryCode);

		const identity = event['requestContext']['identity'];

		const Item = {
			[TableKeys.PK]: buildAssistantKey(assistantId),
			[TableKeys.SK]: buildAssistantResponseKey(id),
			[AssistantResponseAttributes.ID]: id,
			[AssistantResponseAttributes.MESSAGE_ID]: messageId,
			[AssistantResponseAttributes.PROMPT]: prompt,
			[AssistantResponseAttributes.RESPONSE]: response,
			[AssistantResponseAttributes.IDENTITY]: JSON.stringify(identity),
			[AssistantResponseAttributes.COUNTRY]: country,
			[AssistantResponseAttributes.CREATED_AT]: Date.now().toString(),
		};

		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		return sendResponse(201, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
