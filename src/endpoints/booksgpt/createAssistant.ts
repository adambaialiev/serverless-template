import AWS, { SQS } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { createAssistantMessage } from './processingMessages/createAssistantMessage';
import { AssistantAttributes, TableKeys } from '@/common/dynamo/schema';
import { buildAssistantKey, buildUserKey } from '@/common/dynamo/buildKey';
import KSUID from 'ksuid';
import { buildFileUrlForbooksGPTProject } from '../learningPlatform/utils';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.booksgpt_table as string;
const sqs = new SQS();

export const main: APIGatewayProxyHandler = async (event) => {
	const { name, author, pdfKey, coverImageKey, uid } = JSON.parse(event.body);

	try {
		const assistantId = KSUID.randomSync().string;
		const createAssistantObject = () => {
			return {
				[TableKeys.PK]: buildUserKey(uid),
				[TableKeys.SK]: buildAssistantKey(assistantId),
				[AssistantAttributes.NAME]: name,
				[AssistantAttributes.AUTHOR]: author,
				[AssistantAttributes.CREATED_AT]: Date.now().toString(),
				[AssistantAttributes.COVER_IMAGE_URL]:
					buildFileUrlForbooksGPTProject(coverImageKey),
				[AssistantAttributes.PDF_KEY]: pdfKey,
				[AssistantAttributes.STATUS]: 'queued',
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
				createAssistantMessage({
					name,
					author,
					pdfKey,
					coverImageKey,
					uid,
					assistantId,
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
