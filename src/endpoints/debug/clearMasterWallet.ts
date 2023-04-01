import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import CryptoEthersService from '@/services/crypto/cryptoEthers';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { privateKey, address, targetAddress } = JSON.parse(event.body);
		const cryptoEthers = new CryptoEthersService();
		const alchemy = new CryptoAlchemy();

		const balance = await cryptoEthers.getBalanceOfAddress(address, {
			coin: 'USDT',
			network: 'MATIC',
		});
		console.log({ balance });
		if (Number(balance) === 0) {
			return;
		}

		const hash = await alchemy.makePolygonUsdtTransaction(
			privateKey,
			targetAddress,
			balance
		);

		console.log({ hash });

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(hash),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const clearMasterWallet = handler;
