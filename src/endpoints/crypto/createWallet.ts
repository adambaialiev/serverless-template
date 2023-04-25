import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';
import { SlackNotifications } from '@/utils/slackNotifications';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const hdWalletService = new HDWallet();

		const mnemonic = hdWalletService.generateMnemonic();

		await SlackNotifications.sendMessage(
			'SLACK_CREATE_WALLET_URL',
			`Endpoint createWallet has been executed.`
		);

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(mnemonic),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const createWallet = handler;
