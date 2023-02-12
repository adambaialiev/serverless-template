import BalanceService from '@/services/balance/balance';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import MasterWallet from '@/services/masterWallet/masterWallet';
import UserService from '@/services/user/user';

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
			'ShopWallet',
			`You recieved ${amount} USDT`
		);

		const userService = new UserService();
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
