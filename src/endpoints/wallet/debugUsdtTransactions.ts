import CryptoEthersService from '@/services/crypto/cryptoEthers';
import { APIGatewayProxyHandler } from 'aws-lambda';

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const cryptoService = new CryptoEthersService();
		await cryptoService.makePolygonMaticTransaction(
			'0xf751022586ac7eb183acc858a9c834225f0e7e3d20a14f1386d8672aab696128',
			'0x4851671c8501b0B27907512fb4E2d9321D4B9836',
			'0.01'
		);
		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const debugUsdtTransactions = handler;
