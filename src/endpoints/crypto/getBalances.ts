import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import HDWallet from '@/services/crypto/hdWallet';
import CryptoEthersService, { CoinPack } from '@/services/crypto/cryptoEthers';
import { withAuthorization } from '@/middlewares/withAuthorization';

type CoinPackWithBalance = CoinPack & { balance: string; address: string };

type Balances = CoinPackWithBalance[];

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

		const ethersService = new CryptoEthersService();

		const ethPack = hdWalletService.getEthAddressFromMnemonic(mnemonic, {
			isPublic: true,
		});

		const usdtPolygonBalance = await ethersService.getBalanceOfAddress(
			ethPack.address,
			{ coin: 'USDT', network: 'MATIC' }
		);

		const balancesPack: Balances = [
			{
				coin: 'USDT',
				network: 'MATIC',
				balance: usdtPolygonBalance,
				address: ethPack.address,
			},
		];

		callback(null, {
			statusCode: 200,
			body: JSON.stringify(balancesPack),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const getBalances = withAuthorization(handler);
