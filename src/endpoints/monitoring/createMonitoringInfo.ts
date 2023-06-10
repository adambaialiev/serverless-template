import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';

const handler: APIGatewayProxyHandler = async () => {
	try {
		return sendResponse(201, true);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const createMonitoringInfo = handler;
