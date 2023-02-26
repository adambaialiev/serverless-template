import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';
import MasterWallet from '@/services/masterWallet/masterWallet';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';
import UserService from '@/services/user/user';

export const amountToRaw = (amount: number) =>
	amount.toFixed(6).replace(/\./g, '');

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { address, amount, phoneNumber } = JSON.parse(event.body);

		const masterWalletService = new MasterWallet();

		const cryptoAlchemy = new CryptoAlchemy();

		const masterWallet = await masterWalletService.getMasterWallet();

		const userService = new UserService();

		const user = await userService.getUser(phoneNumber);

		if (Number(amount) > Number(user.balance)) {
			throw new Error('not enough balance');
		}

		const rawAmount = amountToRaw(Number(amount));
		console.log({ rawAmount });
		const hash = await cryptoAlchemy.makePolygonUsdtTransaction(
			masterWallet.privateKey,
			address,
			rawAmount
		);

		await masterWalletService.createWithdrawToProcess({
			amount,
			phoneNumber,
			address,
			hash,
		});

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

export const withdraw = withAuthorization(handler);
