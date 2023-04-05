import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';
import { withAuthorization } from '@/middlewares/withAuthorization';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';

const maticAlchemy = new CryptoAlchemy('MATIC');
const ethAlchemy = new CryptoAlchemy('ETH');

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

		const erc20Balances = await maticAlchemy.getTokenBalances(ethPack.address);
		const ethBalance = await ethAlchemy.getBalance(ethPack.address);
		const maticBalance = await maticAlchemy.getBalance(ethPack.address);

		callback(null, {
			statusCode: 200,
			body: JSON.stringify({
				balances: { ...erc20Balances, ...ethBalance, ...maticBalance },
				address: ethPack.address,
			}),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getBalances = withAuthorization(handler);
