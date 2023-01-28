import { withAuthorization } from '@/middlewares/withAuthorization';
import BalanceService from '@/services/balance/balance';
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';

const balanceService = new BalanceService();

const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber } = event.pathParameters;
		console.log('event', JSON.stringify(event, null, 2));

		const response = await balanceService.getTransactions(phoneNumber);

		console.log('transactionsResponse', response);

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

export const getTransactions = withAuthorization(handler);
