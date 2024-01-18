import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import retrieveRunAPI from './openaiAPI/retrieveRunAPI';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { threadId, runId } = event.pathParameters;

		const response = await retrieveRunAPI(threadId, runId);

		return sendResponse(200, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
