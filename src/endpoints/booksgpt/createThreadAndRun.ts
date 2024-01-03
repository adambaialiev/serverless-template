import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { axiosInstance } from './axiosInstance';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { assistant_id, message } = JSON.parse(event.body);

		const response = await axiosInstance.post('/v1/threads/runs', {
			assistant_id: assistant_id,
			thread: { messages: [{ role: 'user', content: message }] },
		});

		return sendResponse(201, response.data);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
