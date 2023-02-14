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
		const { address, amount, phoneNumber } = JSON.parse(event.body);

		const masterWalletService = new MasterWallet();

		await masterWalletService.withdraw(address, amount, phoneNumber);

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
