import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import MasterWallet from '@/services/masterWallet/masterWallet';

export const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber, amount, transactionHash } = JSON.parse(
			event.body as string
		);
		console.log({ phoneNumber, amount, transactionHash });

		const masterWalletService = new MasterWallet();
		await masterWalletService.withdrawSuccess(
			transactionHash,
			amount,
			phoneNumber
		);

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const homePendingAll = handler;
