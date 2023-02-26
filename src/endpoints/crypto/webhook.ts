import BalanceService from '@/services/balance/balance';
import { CryptoService } from '@/services/crypto/crypto';
import CryptoEthersService from '@/services/crypto/cryptoEthers';
import MasterWallet from '@/services/masterWallet/masterWallet';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';
import { APIGatewayProxyHandler } from 'aws-lambda';

interface WebHookAlchemyEventActivity {
	fromAddress: string;
	toAddress: string;
	blockNum: string;
	hash: string;
	value: string;
	asset: 'USDT' | 'MATIC';
	category: string;
}

interface WebHookAlchemyEvent {
	network: string;
	activity: WebHookAlchemyEventActivity[];
}

interface WebHookAlchemyResponse {
	webhookId: string;
	id: string;
	createdAt: string;
	type: string;
	event: WebHookAlchemyEvent;
}

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	const crypto = new CryptoService();
	const cryptoEthers = new CryptoEthersService();
	const masterWalletService = new MasterWallet();
	const userService = new UserService();
	try {
		const alchemyResponse = JSON.parse(
			event.body as string
		) as WebHookAlchemyResponse;
		console.log({ alchemyResponse, event: alchemyResponse.event });
		const allWallets = await userService.getAllWallets();
		console.log({ allWallets });
		if (!allWallets) {
			return;
		}

		const masterWallet = await masterWalletService.getMasterWallet();
		console.log({ masterWallet });
		for (let i = 0; i < alchemyResponse.event.activity.length; i++) {
			const activity = alchemyResponse.event.activity[i];
			console.log({ activity });
			// detect deposit transaction
			if (activity.asset === 'USDT' && allWallets[activity.toAddress]) {
				const balanceService = new BalanceService();

				const pushNotificationService = new PushNotifications();

				const { phoneNumber } = allWallets[activity.toAddress];

				const amount = Number(activity.value);

				await balanceService.incrementBalance({
					phoneNumber,
					amount,
					hash: activity.hash,
					address: activity.toAddress,
				});

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
				const touchTransactionHash = await crypto.makeTouchTransaction(
					masterWallet.privateKey,
					activity.toAddress
				);
				console.log({ touchTransactionHash });
			}
			// detect successful withdraw
			if (
				activity.asset === 'USDT' &&
				activity.fromAddress === masterWallet.publicAddress.toLowerCase()
			) {
				await masterWalletService.withdrawSuccess(activity.hash);
			}
			// detect touch transaction
			if (activity.asset === 'MATIC' && allWallets[activity.toAddress]) {
				const userWallet = allWallets[activity.toAddress];

				const balance = await cryptoEthers.getBalanceOfAddress(
					activity.toAddress
				);
				console.log({ balance });
				if (Number(balance) === 0) {
					return;
				}
				const homeTransactionHash = await crypto.makeHomeTransaction(
					userWallet.privateKey,
					masterWallet.publicAddress,
					balance,
					activity.hash
				);
				console.log({ homeTransactionHash });
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

export const webhook = handler;