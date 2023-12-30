import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { axiosInstance } from './axiosInstance';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { threadId } = event.pathParameters;

		const response = await axiosInstance.get(`v1/threads/${threadId}/messages`);

		return sendResponse(200, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
