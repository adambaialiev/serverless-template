import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import listMessagersAPI from './openaiAPI/listMessagesAPI';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { threadId, apiKey } = event.pathParameters;

		const response = await listMessagersAPI(threadId, apiKey);

		return sendResponse(200, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
