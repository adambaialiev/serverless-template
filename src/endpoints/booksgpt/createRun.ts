import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { axiosInstance } from './axiosInstance';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { threadId } = event.pathParameters;
		const { assistant_id } = JSON.parse(event.body);

		const response = await axiosInstance.post(`/v1/threads/${threadId}/runs`, {
			assistant_id,
		});

		return sendResponse(201, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
