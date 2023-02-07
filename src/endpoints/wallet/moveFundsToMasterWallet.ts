import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';
import MasterWallet from '@/services/masterWallet/masterWallet';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { phoneNumber, amount, publicAddress } = JSON.parse(event.body);

		const masterWalletService = await new MasterWallet();

		await masterWalletService.moveFundsToMasterWallet(
			phoneNumber,
			amount,
			publicAddress
		);

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

export const moveFundsToMasterWallet = withAuthorization(handler);
