import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { TransactionService } from '@/services/transaction/transactionService';

const transactionsService = new TransactionService();

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const { phoneNumber } = JSON.parse(event.body);
		const { id } = event.pathParameters;

		const source = event.user;

		const res = await transactionsService.declineRequest(
			source.phoneNumber,
			phoneNumber,
			id
		);

		return sendResponse(200, res);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, { message: error.message });
		}
	}
};

export const declineRequest = withAuthorization(handler);
