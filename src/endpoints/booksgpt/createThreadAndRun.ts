import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import createThreadAndRunAPI from './openaiAPI/createThreadAndRunAPI';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { assistant_id, message, apiKey } = JSON.parse(event.body);

		const response = await createThreadAndRunAPI(assistant_id, message, apiKey);
		return sendResponse(201, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
