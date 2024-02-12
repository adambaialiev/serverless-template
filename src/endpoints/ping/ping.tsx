import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async () => {
	try {
		return sendResponse(200, {
			response: 'Pong',
		});
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
