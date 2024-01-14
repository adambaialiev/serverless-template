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

	const assistantCreationParams = {
		assistantId: 'assistantId#1',
		model: 'gpt-3.5-turbo-1106',
		instructions: 'You are helpful assistant',
		tools: 'retrieval',
	};

	try {
		const uploadFileResponse = await axiosInstance.post(`/v1/files`, {
			file: fs.createReadStream(filePdf),
			purpose: 'assistants',
		});

		const createAssistantResponse = await axiosInstance.post(`/v1/assistants`, {
			...assistantCreationParams, fileIds: [uploadFileResponse.data.id],
		});

		await dynamoDb
			.put({
				TableName,
				Item: {
					[TableKeys.PK]: buildUserKey(uid),
					[TableKeys.SK]: buildAssistantKey(assistantCreationParams.assistantId),
					[AssistantAttributes.NAME]: name,
					[AssistantAttributes.AUTHOR]: author,
					[AssistantAttributes.MODEL]: assistantCreationParams.model,
					[AssistantAttributes.INSTRUCTIONS]: assistantCreationParams.instructions,
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
