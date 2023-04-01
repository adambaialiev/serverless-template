import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { address } = JSON.parse(event.body) as {
			address?: string;
		};
		if (!address) {
			return sendResponse(400, { message: 'Address is required' });
		}

		const cryptoTransactionsService = new CryptoAlchemy();

		const transactions = await cryptoTransactionsService.getTransactionsHistory(
			address
		);

		callback(null, {
			statusCode: 200,
			body: JSON.stringify(transactions),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getTransactions = withAuthorization(handler);
