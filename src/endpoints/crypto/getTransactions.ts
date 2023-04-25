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
		if (!address) {
			return sendResponse(400, { message: 'Address is required' });
		}

		if (type === 'ETH') {
			const ethTransactions =
				await ethCryptoTransactionsService.getTransactionsHistory(address);
			return sendResponse(200, ethTransactions);
		}
		const maticTransactions =
			await maticCryptoTransactionsService.getTransactionsHistory(address);

		await SlackNotifications.sendMessage(
			'SLACK_GET_TRANSACTION_URL',
			`Endpoint getTransactions has been executed.\nAddress: ${address}.\nType: ${type}.`
		);

		return sendResponse(200, maticTransactions);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getTransactions = handler;
