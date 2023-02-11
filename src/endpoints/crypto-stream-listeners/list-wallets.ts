import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const body = JSON.parse(event.body);

		if (!body.txs.length) {
			callback(null, {
				statusCode: 200,
				body: JSON.stringify(true),
			});
		} else {
			// detect deposit transactions and initialize touch operation
			// detect touch operation and initialize home operation
			// detect home operation and update it to success
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const createWallet = handler;
