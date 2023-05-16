import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';
import { SlackNotifications } from '@/utils/slackNotifications';

const maticAlchemy = new CryptoAlchemy('MATIC');
const ethAlchemy = new CryptoAlchemy('ETH');

export const getBalances: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { address } = JSON.parse(event.body) as { address: string };
		if (!address) {
			return sendResponse(400, { message: 'Address is required' });
		}

		const erc20Balances = await maticAlchemy.getTokenBalances(address);
		const ethBalance = await ethAlchemy.getBalance(address);
		const maticBalance = await maticAlchemy.getBalance(address);

		const sourceCountryCode = event.headers['CloudFront-Viewer-Country'];

		await SlackNotifications.sendMessage(
			'getBalances',
			'SLACK_GET_BALANCES_URL',
			sourceCountryCode,
			`Balances: ${JSON.stringify({
				...erc20Balances,
				...ethBalance,
				...maticBalance,
			})}`
		);

		callback(null, {
			statusCode: 200,
			body: JSON.stringify({
				balances: { ...erc20Balances, ...ethBalance, ...maticBalance },
				address,
			}),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
