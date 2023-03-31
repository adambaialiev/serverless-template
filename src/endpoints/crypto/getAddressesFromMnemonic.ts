import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { mnemonic } = JSON.parse(event.body as string);
		const hdWalletService = new HDWallet();

		const ethAddress = hdWalletService.getEthAddressFromMnemonic(mnemonic);
		const btcAddress = hdWalletService.getBtcAddressFromMnemonic(mnemonic);

		callback(null, {
			statusCode: 201,
			body: JSON.stringify({ ...ethAddress, ...btcAddress }),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getAddressesFromMnemonic = handler;
