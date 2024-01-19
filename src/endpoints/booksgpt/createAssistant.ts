import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import {
	AssistantAttributes,
	AssisttantStatus,
	Entities,
	JobType,
	PendingRunAttributes,
	TableKeys,
} from '@/common/dynamo/schema';
import {
	buildAssistantKey,
	buildPendingRunKey,
	buildUserKey,
} from '@/common/dynamo/buildKey';
import { axiosInstance } from '@/endpoints/booksgpt/axiosInstance';
import * as fs from 'fs';
import { buildFileUrlForbooksGPTProject } from '../learningPlatform/utils';
import createThreadAndRunAPI from './openaiAPI/createThreadAndRunAPI';
import OpenAI from 'openai';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	const { name, author, pdfKey, coverImageKey, uid } = JSON.parse(event.body);

	const coverImageUrl = buildFileUrlForbooksGPTProject(coverImageKey);
	const pdfUrl = buildFileUrlForbooksGPTProject(pdfKey);

	const openai = new OpenAI();

	try {
		const file = await openai.files.create({
			file: fs.createReadStream('pdfUrl'),
			purpose: 'assistants',
		});

		const assistantCreationParams = {
			name: `${name} by ${author}`,
			model: 'gpt-4-1106-preview',
			instructions: `You are an assistant that have read the book called ${name} by ${author}. You should be able to summurize the book, its chapters and respond to any other questions about the book.`,
			tools: [{ type: 'retrieval' }],
		};

		const createAssistantResponse = await axiosInstance.post(`/v1/assistants`, {
			...assistantCreationParams,
			file_ids: [file.id],
		});

		const assistantId = createAssistantResponse.data.id;

		const createAssistantObject = () => {
			return {
				[TableKeys.PK]: buildUserKey(uid),
				[TableKeys.SK]: buildAssistantKey(assistantId),
				[AssistantAttributes.NAME]: assistantCreationParams,
				[AssistantAttributes.AUTHOR]: author,
				[AssistantAttributes.MODEL]: assistantCreationParams.model,
				[AssistantAttributes.INSTRUCTIONS]:
					assistantCreationParams.instructions,
				[AssistantAttributes.CREATED_AT]: Date.now().toString(),
				[AssistantAttributes.CHAPTERS_LIST]: [] as string[],
				[AssistantAttributes.CHAPTERS_SUMMARY]: '',
				[AssistantAttributes.COVER_IMAGE_URL]: coverImageUrl,
				[AssistantAttributes.PDF_URL]: pdfUrl,
				[AssistantAttributes.GENERAL_SUMMARY]: '',
				[AssistantAttributes.STATUS]: AssisttantStatus.QueuedForProcessing,
			};
		};

		await dynamoDb
			.put({
				TableName,
				Item: createAssistantObject(),
			})
			.promise();

		const chaptersExtractionPrompt = `Give me a complete list of chapters as an array of strings. Don't add additional words or comments. Only an array of strings.`;

		const createThreadAndRunAPIResponse = await createThreadAndRunAPI(
			assistantId,
			chaptersExtractionPrompt
		);
		if (createThreadAndRunAPIResponse.data.status === 'queued') {
			const runId = createThreadAndRunAPIResponse.data.id;
			try {
				await dynamoDb.put({
					TableName,
					Item: {
						[TableKeys.PK]: Entities.PENDING_RUN,
						[TableKeys.SK]: buildPendingRunKey(runId),
						[PendingRunAttributes.ID]: runId,
						[PendingRunAttributes.ASSISTANT_ID]: assistantId,
						[PendingRunAttributes.CREATED_AT]: Date.now().toString(),
						[PendingRunAttributes.THREAD_ID]:
							createThreadAndRunAPIResponse.data.thread_id,
						[PendingRunAttributes.JOB_TYPE]: JobType.CHAPTERS_LIST_EXTRACTION,
					},
				});
			} catch (error) {
				console.log({ error });
			}
		}

		return sendResponse(200, { data: createAssistantResponse.data });
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
