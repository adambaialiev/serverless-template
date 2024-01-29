import AWS, { SQS } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import {
	AssistantAttributes,
	Entities,
	TableKeys,
} from '@/common/dynamo/schema';
import { buildAssistantKey } from '@/common/dynamo/buildKey';
import { buildFileUrlForbooksGPTProject } from '../learningPlatform/utils';
import { extractChapterListMessage } from './processingMessages/extractChapterListMessage';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.booksgpt_table as string;
const sqs = new SQS();

export const main: APIGatewayProxyHandler = async (event) => {
	const {
		name,
		author,
		coverImageKey,
		assistantId,
		fileId,
		openAiKey,
		model,
		instructions,
	} = JSON.parse(event.body);

	try {
		const createAssistantObject = () => {
			return {
				[TableKeys.PK]: Entities.ASSISTANT,
				[TableKeys.SK]: buildAssistantKey(assistantId),
				[AssistantAttributes.NAME]: name,
				[AssistantAttributes.AUTHOR]: author,
				[AssistantAttributes.CREATED_AT]: Date.now().toString(),
				[AssistantAttributes.COVER_IMAGE_URL]:
					buildFileUrlForbooksGPTProject(coverImageKey),
				[AssistantAttributes.FILE_ID]: fileId,
				[AssistantAttributes.STATUS]: 'Queued',
				[AssistantAttributes.OPEN_AI_KEY]: openAiKey,
				[AssistantAttributes.MODEL]: model,
				[AssistantAttributes.INSTRUCTIONS]: instructions,
			};
		};

		await dynamoDb
			.put({
				TableName,
				Item: createAssistantObject(),
			})
			.promise();
		await sqs
			.sendMessage(
				extractChapterListMessage({
					assistantId,
					apiKey: openAiKey,
				})
			)
			.promise();

		return sendResponse(200, true);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
