import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import MasterWallet from '@/services/masterWallet/masterWallet';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { touchTransactionHash } = JSON.parse(event.body);

		const masterWallet = await new MasterWallet();

		await masterWallet.masterWalletHomeTransactionSuccess(touchTransactionHash);

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

export const masterWalletHomeTransactionSuccess = handler;
