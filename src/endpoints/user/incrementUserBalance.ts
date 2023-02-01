import BalanceService from '@/services/balance/balance';
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';

const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber, amount } = JSON.parse(event.body as string);

		const balanceService = new BalanceService();
		console.log('event', JSON.stringify(event, null, 2));

		await balanceService.incrementBalance(phoneNumber, Number(amount));

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

export const incrementUserBalance = handler;
