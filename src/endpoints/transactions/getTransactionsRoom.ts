import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import BalanceService from '@/services/balance/balance';
import { APIGatewayProxyHandler } from 'aws-lambda';

const balanceService = new BalanceService();

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway
) => {
	try {
		const { target } = JSON.parse(event.body);
		console.log('event', JSON.stringify(event, null, 2));
		const source = event.user.phoneNumber;

		const response = await balanceService.getTransactionsRoom(source, target);

		console.log('UsersTransactionsResponse', response);

		return {
			statusCode: 200,
			body: JSON.stringify(response.Items),
		};
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

export const getTransactionsRoom = withAuthorization(handler);
