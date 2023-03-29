import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const hdWalletService = new HDWallet();

		hdWalletService.generateMnemonic();

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

export const debug = handler;
