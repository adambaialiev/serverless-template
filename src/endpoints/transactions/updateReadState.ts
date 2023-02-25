import { APIGatewayProxyHandler } from 'aws-lambda';
import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { TransactionService } from '@/services/transaction/transactionService';
import { sendResponse } from '@/utils/makeResponse';

const transactionService = new TransactionService();

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway
) => {
	try {
		const { id } = event.pathParameters;

		const sourcePhoneNumber = event.user.phoneNumber;

		const response = await transactionService.updateIsReadState(
			sourcePhoneNumber,
			id
		);

		return sendResponse(200, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const updateReadState = withAuthorization(handler);
