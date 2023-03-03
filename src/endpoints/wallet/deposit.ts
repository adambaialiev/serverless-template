import BalanceService from '@/services/balance/balance';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';

const userService = new UserService();

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber, amount, transactionHash, address } = JSON.parse(
			event.body as string
		);
		console.log({ phoneNumber, amount, transactionHash, address });
		if (!phoneNumber || !amount || !transactionHash || !address) {
			throw new Error('not enough parameters');
		}
		const balanceService = new BalanceService();

		const pushNotificationService = new PushNotifications();

		await balanceService.incrementBalance({
			phoneNumber,
			amount: Number(amount),
			hash: transactionHash,
			address,
		});

		const userOutput = await userService.getSlug(phoneNumber);

		try {
			if (userOutput.pushToken) {
				await pushNotificationService.send(
					userOutput.pushToken,
					`You received ${amount} USDT`,
					userOutput.unreadNotifications
				);
			}
		} catch (error) {
			console.log({ error });
		}

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

export const deposit = handler;
