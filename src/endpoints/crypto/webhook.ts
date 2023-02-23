import { CryptoService } from '@/services/crypto/crypto';
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
	const masterWalletService = new MasterWallet();
	try {
		const alchemyResponse = JSON.parse(
			event.body as string
		) as WebHookAlchemyResponse;
		console.log({ alchemyResponse, event: alchemyResponse.event });
		alchemyResponse.event.activity.forEach((activity) =>
			console.log({ activity })
		);
		const masterWallet = await masterWalletService.getMasterWallet();
		console.log({ masterWallet });
		for (const activity of alchemyResponse.event.activity) {
			if (activity.asset === 'USDT') {
				await crypto.makeTouchTransaction(
					masterWallet.privateKey,
					activity.toAddress
				);
			}
			if (activity.asset === 'MATIC') {
				// const userWallet = userService.getUserPolygonWallet()
				// await crypto.makeHomeTransaction()
				//
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
