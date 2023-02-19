import BalanceService from '@/services/balance/balance';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import MasterWallet from '@/services/masterWallet/masterWallet';
import UserService from '@/services/user/user';

const userService = new UserService();
const balanceService = new BalanceService();
const masterWallet = new MasterWallet();
const pushNotificationService = new PushNotifications();

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber, amount, transactionHash } = JSON.parse(
			event.body as string
		);
		console.log({ phoneNumber, amount, transactionHash });
		if (!phoneNumber || !amount || !transactionHash) {
			throw new Error('not enough parameters');
		}
		await balanceService.incrementBalance(
			phoneNumber,
			Number(amount),
			transactionHash
		);

		const userOutput = await userService.getSlug(phoneNumber);

		try {
			if (userOutput.pushToken) {
				await pushNotificationService.send(
					userOutput.pushToken,
					`You received ${amount} USDT`
				);
			}
		} catch (error) {
			console.log({ error });
		}

		const user = await userService.getUser(phoneNumber);
		console.log({ user });

		if (user.wallets && user.wallets.length) {
			const wallet = user.wallets.find((w) => w.network === 'polygon');
			console.log({ wallet });
			if (wallet) {
				await masterWallet.touchUserWallet(wallet.publicKey, phoneNumber);
				console.log('after touch user wallet');
			}
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
