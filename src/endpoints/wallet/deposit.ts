import BalanceService from '@/services/balance/balance';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import MasterWallet from '@/services/masterWallet/masterWallet';

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber, amount, transactionHash } = JSON.parse(
			event.body as string
		);
		console.log({ phoneNumber, amount, transactionHash });
		if (!phoneNumber || !amount || !transactionHash) {
			throw new Error('not enough parameters');
		}
		const balanceService = new BalanceService();
		const masterWallet = new MasterWallet();
		const pushNotificationService = new PushNotifications();

		await balanceService.incrementBalance(
			phoneNumber,
			Number(amount),
			transactionHash
		);

		await pushNotificationService.send(
			phoneNumber,
			'Shop wallet',
			`You recieved ${amount} USDT`
		);

		await masterWallet.touchUserWallet();

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const incrementUserBalance = handler;
