import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';
import { SlackNotifications } from '@/utils/slackNotifications';

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const maticCryptoTransactionsService = new CryptoAlchemy('MATIC');
		const ethCryptoTransactionsService = new CryptoAlchemy('ETH');
		const { address, type } = JSON.parse(event.body) as {
			address: string;
			type?: 'ETH' | 'MATIC';
		};
		const sourceCountryCode = event.headers['CloudFront-Viewer-Country'];
			await SlackNotifications.sendMessage(
				'getTransactions',
				'SLACK_GET_TRANSACTION_URL',
				sourceCountryCode,
				`Address: ${address}.\nType: ${type}.`
			);
		if (!address) {
			return sendResponse(400, { message: 'Address is required' });
		}

		const ethTransactions =
			await ethCryptoTransactionsService.getTransactionsHistory(address);
		const maticTransactions =
			await maticCryptoTransactionsService.getTransactionsHistory(address);


		return sendResponse(200, [...maticTransactions, ...ethTransactions]);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getTransactions = handler;
