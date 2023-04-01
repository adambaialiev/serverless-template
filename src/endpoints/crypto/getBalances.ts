import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';
import { withAuthorization } from '@/middlewares/withAuthorization';
import CryptoTatum from '@/services/crypto/cryptoTatum';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { mnemonic } = JSON.parse(event.body) as { mnemonic?: string };
		if (!mnemonic) {
			return sendResponse(400, { message: 'Mnemonic is required' });
		}
		const hdWalletService = new HDWallet();
		const tatum = new CryptoTatum();

		const ethPack = hdWalletService.getEthAddressFromMnemonic(mnemonic, {
			isPublic: true,
		});

		const balances = await tatum.getBalanceOfAddress(
			ethPack.address,
			'ethereum'
		);

		callback(null, {
			statusCode: 200,
			body: JSON.stringify(balances),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getBalances = withAuthorization(handler);
