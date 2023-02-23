import { UserWalletAttributes } from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import CryptoEthersService from '@/services/crypto/cryptoEthers';
import MasterWallet from '@/services/masterWallet/masterWallet';
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
		if (!allWallets) {
			return;
		}
		alchemyResponse.event.activity.forEach((activity) =>
			console.log({ activity })
		);
		const masterWallet = await masterWalletService.getMasterWallet();
		console.log({ masterWallet });
		for (const activity of alchemyResponse.event.activity) {
			if (activity.asset === 'USDT' && allWallets[activity.toAddress]) {
				await crypto.makeTouchTransaction(
					masterWallet.privateKey,
					activity.toAddress
				);
			}
			if (activity.asset === 'MATIC' && allWallets[activity.toAddress]) {
				const userWallet = allWallets[activity.toAddress];

				const balance = await cryptoEthers.getBalanceOfAddress(
					userWallet[UserWalletAttributes.ADDRESS]
				);
				const homeTransactionHash = await crypto.makeHomeTransaction(
					userWallet.privateKey,
					masterWallet.publicAddress,
					balance
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
