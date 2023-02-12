import { CryptoService } from '@/services/crypto/crypto';
import { APIGatewayProxyHandler } from 'aws-lambda';

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const cryptoService = await new CryptoService();
		await cryptoService.makePolygonUsdtTransactionToMasterWallet(
			'0x387306bc73994d95416d36c2a1ed269e9b69245b1715860e818cc963e4000322',
			'0x9cddeB80a7BE37e7daCA7e9c4F193e781dD157e6'
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
