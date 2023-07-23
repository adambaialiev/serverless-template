import { APIGatewayProxyHandler } from 'aws-lambda';
import { CustomAPIGateway } from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const body = JSON.parse(event.body);
		console.log({ body });

		return sendResponse(200, { message: 'Message processed successfully' });
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const webhook = handler;
