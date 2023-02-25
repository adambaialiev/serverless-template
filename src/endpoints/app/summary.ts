import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import UserService from '@/services/user/user';
import CryptoEthersService from '@/services/crypto/cryptoEthers';
import MasterWallet from '@/services/masterWallet/masterWallet';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const crypto = new CryptoEthersService();
		const userService = new UserService();

		const allWallets = await userService.getAllWallets();
		const masterWalletService = new MasterWallet();

		const allWalletsWithBalance = {} as { [key: string]: string };

		for (const address of Object.keys(allWallets)) {
			allWalletsWithBalance[address] = await crypto.getBalanceOfAddress(
				address
			);
			address;
		}

		const masterWallet = await masterWalletService.getMasterWallet();

		const masterWalletBalance = await crypto.getBalanceOfAddress(
			masterWallet.publicAddress
		);

		const { poolBalance, usersList } =
			await userService.getPoolBalanceAndUsersList();

		const result = {
			allWallets: allWalletsWithBalance,
			masterWalletBalance,
			poolBalance,
			usersList,
		};

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(result),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const summary = handler;
