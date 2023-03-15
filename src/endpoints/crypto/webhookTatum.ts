import { CryptoService } from '@/services/crypto/crypto';
import CryptoEthersService from '@/services/crypto/cryptoEthers';
import MasterWallet from '@/services/masterWallet/masterWallet';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';
import { APIGatewayProxyHandler } from 'aws-lambda';

interface WebHookTatumResponse {
	address: string;
	timestamp: string;
	amount: string;
	asset: string;
	blockNumber: number;
	counterAddress?: string;
	txId: string;
}

const USDT_ASSET = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	const crypto = new CryptoService();
	const cryptoEthers = new CryptoEthersService();
	const masterWalletService = new MasterWallet();
	const userService = new UserService();
	const pushNotificationService = new PushNotifications();

	try {
		const tatumResponse = JSON.parse(
			event.body as string
		) as WebHookTatumResponse;
		console.log({ tatumResponse });
		const allWallets = await userService.getAllWallets();
		console.log({ allWallets });
		if (!allWallets) {
			return;
		}

		const masterWallet = await masterWalletService.getMasterWallet();
		console.log({ masterWallet });
		const { asset, counterAddress, amount, txId, blockNumber, address } =
			tatumResponse;
		if (!counterAddress) {
			callback(null, {
				statusCode: 201,
				body: JSON.stringify(true),
			});
			return;
		}
		const toAddress = counterAddress.toLowerCase();
		// detect deposit transaction
		if (asset === USDT_ASSET && allWallets[toAddress]) {
			const { phoneNumber } = allWallets[toAddress];

			await masterWalletService.createDepositToValidate({
				amount,
				phoneNumber,
				address: toAddress,
				hash: txId,
				blockNum: String(blockNumber),
			});

			try {
				const userOutput = await userService.getSlug(phoneNumber);
				if (userOutput.pushToken) {
					await pushNotificationService.send({
						pushToken: userOutput.pushToken,
						body: `Deposit is detected. You're going to receive ${amount} USDT`,
						badgeCount: userOutput.unreadNotifications,
					});
				}
			} catch (error) {
				console.log({ error });
			}

			const touchTransactionHash = await crypto.makeTouchTransaction(
				masterWallet.privateKey,
				toAddress
			);
			console.log({ touchTransactionHash });
		}
		// detect successful withdraw
		if (
			asset === USDT_ASSET &&
			address.toLowerCase() === masterWallet.publicAddress.toLowerCase()
		) {
			console.log('successful withdraw detected');
			await masterWalletService.withdrawSuccess(txId);
		}
		// detect touch transaction
		if (asset === 'MATIC' && allWallets[address]) {
			const userWallet = allWallets[address];

			const balance = await cryptoEthers.getBalanceOfAddress(address);
			console.log({ balance });
			if (Number(balance) === 0) {
				return;
			}
			const homeTransactionHash = await crypto.makeHomeTransaction(
				userWallet.privateKey,
				masterWallet.publicAddress,
				balance,
				txId
			);
			console.log({ homeTransactionHash });
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
