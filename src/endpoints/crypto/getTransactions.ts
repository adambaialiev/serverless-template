import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';
import { Coin } from '@/services/crypto/cryptoEthers';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { address, coin, network } = JSON.parse(event.body) as {
			address?: string;
			coin?: Coin;
			network?: string;
		};
		if (!address || !coin) {
			return sendResponse(400, { message: 'Not enough params' });
		}

		const cryptoTransactionsService = new CryptoAlchemy();

		let transactions: any = [];

		if (!network) {
			transactions = await cryptoTransactionsService.getTransactionsHistory(
				address
			);
		}

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
