import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';
import { CryptoService } from '@/services/crypto/crypto';
import MasterWallet from '@/services/masterWallet/masterWallet';
import CryptoStreams from '@/services/cryptoStreams/cryptoStreams';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { phoneNumber } = JSON.parse(event.body);

		const cryptoService = new CryptoService();
		const masterWallet = new MasterWallet();
		const cryptoStreams = new CryptoStreams();

		await masterWallet.createMasterWalletIfNeeded();
		const streamId = await cryptoStreams.createWalletsStreamIfNeeded();

		const account = await cryptoService.createCryptoWallet(phoneNumber);
		await cryptoStreams.addWalletToStream(account.address, streamId);

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
