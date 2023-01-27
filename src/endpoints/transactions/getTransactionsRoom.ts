import BalanceService from '@/services/balance/balance';
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';

const balanceService = new BalanceService();

export const getTransactionsRoom = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { source, target } = JSON.parse(event.body);
		console.log('event', JSON.stringify(event, null, 2));

		const response = await balanceService.getTransactionsRoom(source, target);

		console.log('UsersTransactionsResponse', response);

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(response.Items),
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
