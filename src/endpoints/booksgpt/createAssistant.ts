import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { AssistantAttributes, TableKeys } from '@/common/dynamo/schema';
import { buildAssistantKey, buildUserKey } from '@/common/dynamo/buildKey';
import { axiosInstance } from '@/endpoints/booksgpt/axiosInstance';
import * as fs from 'fs';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	const { name, author, filePdf, uid } = JSON.parse(event.body);

	try {
		const uploadFileResponse = await axiosInstance.post(`/v1/files`, {
			file: fs.createReadStream(filePdf),
			purpose: 'assistants',
		});

		const assistantCreationParams = {
			name: `${name} by ${author}`,
			model: 'gpt-4-1106-preview',
			instructions: `You are a friendly assistant that have read the book called ${name} by ${author}. You should be able to summurize the book, its chapters and respond to any other questions about the book.`,
			tools: [{ type: 'retrieval' }],
		};

		const createAssistantResponse = await axiosInstance.post(`/v1/assistants`, {
			...assistantCreationParams,
			file_ids: [uploadFileResponse.data.id],
		});

		await dynamoDb
			.put({
				TableName,
				Item: {
					[TableKeys.PK]: buildUserKey(uid),
					[TableKeys.SK]: buildAssistantKey(createAssistantResponse.data.id),
					[AssistantAttributes.NAME]: name,
					[AssistantAttributes.AUTHOR]: author,
					[AssistantAttributes.MODEL]: assistantCreationParams.model,
					[AssistantAttributes.INSTRUCTIONS]:
						assistantCreationParams.instructions,
					[AssistantAttributes.CREATED_AT]: Date.now().toString(),
				},
			})
			.promise();

		return sendResponse(200, { data: createAssistantResponse.data });
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
