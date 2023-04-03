import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';
import { withAuthorization } from '@/middlewares/withAuthorization';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';

const alchemy = new CryptoAlchemy('MATIC');

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { mnemonic } = JSON.parse(event.body) as { mnemonic: string };
		if (!mnemonic) {
			return sendResponse(400, { message: 'Mnemonic is required' });
		}
		const hdWalletService = new HDWallet();

		const ethPack = hdWalletService.getEthAddressFromMnemonic(mnemonic, {
			isPublic: true,
		});

		const balances = await alchemy.getTokenBalances(ethPack.address);

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
