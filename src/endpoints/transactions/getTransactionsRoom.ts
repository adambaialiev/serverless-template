import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import { TransactionService } from '@/services/transaction/transactionService';
import { APIGatewayProxyHandler } from 'aws-lambda';

const transactionsService = new TransactionService();

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway
) => {
	try {
		const { target } = JSON.parse(event.body);
		console.log('event', JSON.stringify(event, null, 2));
		const source = event.user.phoneNumber;

		const response = await transactionsService.getTransactionsRoom(
			source,
			target
		);

		console.log('UsersTransactionsResponse', response);

		return {
			statusCode: 200,
			body: JSON.stringify(response),
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
