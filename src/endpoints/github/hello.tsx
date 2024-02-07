import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async (event) => {
	const { message } = JSON.parse(event.body);
	try {
		const response = `Hello from Lambda! ${message}`;
		console.log({ response });
		return sendResponse(200, { message: response });
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
