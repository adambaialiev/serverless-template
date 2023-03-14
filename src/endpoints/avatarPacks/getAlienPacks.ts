import { alienPackUrls } from '@/constants';
import { withAuthorization } from '@/middlewares/withAuthorization';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
const handler: APIGatewayProxyHandler = async () => {
	try {
		return sendResponse(200, alienPackUrls);
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const getAlienPacks = withAuthorization(handler);
