import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';
import { CryptoService } from '@/services/crypto/crypto';
import MasterWallet from '@/services/masterWallet/masterWallet';

const cryptoService = new CryptoService();
const masterWallet = new MasterWallet();

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { phoneNumber } = JSON.parse(event.body);

		await cryptoService.createCryptoWallet(phoneNumber);

		await masterWallet.createMasterWalletIfNeeded();

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

export const createWallet = withAuthorization(handler);
