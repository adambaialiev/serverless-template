import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import MasterWallet from '@/services/masterWallet/masterWallet';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';
import { DepositToValidateAttributes } from '@/common/dynamo/schema';
import BalanceService from '@/services/balance/balance';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const masterWalletService = new MasterWallet();

		const alchemy = new CryptoAlchemy();

		const balanceService = new BalanceService();

		const pushNotificationService = new PushNotifications();

		const userService = new UserService();

		const depositsToValidate =
			await masterWalletService.getDepositsToValidate();

		if (depositsToValidate) {
			for (let i = 0; i < depositsToValidate.length; i++) {
				const d = depositsToValidate[i];
				const hash = d[DepositToValidateAttributes.ID];
				const blockNum = d.blockNum;
				const validationNumber = await alchemy.getValidatedBlocks(
					hash,
					blockNum
				);
				const { phoneNumber, amount, address } = d;
				console.log({ validationNumber, hash, d });
				if (typeof validationNumber === 'undefined') {
					continue;
				}
				if (validationNumber > 128) {
					await balanceService.incrementBalance({
						phoneNumber,
						amount: Number(amount),
						hash,
						address,
					});

					const userOutput = await userService.getSlug(phoneNumber);

					try {
						if (userOutput.pushToken) {
							await pushNotificationService.send(
								userOutput.pushToken,
								`Deposit is validated. You received ${amount} USDT`,
								userOutput.unreadNotifications
							);
						}
					} catch (error) {
						console.log({ error });
					}
				} else {
					await masterWalletService.updateDepositValidationValue(
						phoneNumber,
						hash,
						`${validationNumber}/128`
					);
				}
			}
		}

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const validateDeposits = handler;
