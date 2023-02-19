import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import { TransactionService } from '@/services/transaction/transactionService';
import { sendResponse } from '@/utils/makeResponse';

const transactionsService = new TransactionService();

const handler = async (event: CustomAPIGateway) => {
	try {
		const { phoneNumber } = event.user;

		const response = await transactionsService.getTransactions(phoneNumber);

		return sendResponse(200, response.Items);
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
