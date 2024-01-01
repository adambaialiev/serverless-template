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

		const { responses } = JSON.parse(event.body) as {
			responses: { prompt: string; response: string; messageId?: string }[];
		};

		const feedOutput = await dynamo
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

		for (const r of responses) {
			const { prompt, response, messageId } = r;

			if (
				feedOutput.Items?.length &&
				feedOutput.Items.find((item) => item.messageId === messageId)
			) {
				continue;
			}
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
				[AssistantResponseAttributes.IS_PUBLIC]: false,
			};

			await dynamo
				.put({
					Item,
					TableName,
					ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
				})
				.promise();
		}

		return sendResponse(201, true);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
