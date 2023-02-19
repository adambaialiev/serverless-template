import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { TransactionService } from '@/services/transaction/transactionService';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';

const transactionsService = new TransactionService();
const pushNotificationService = new PushNotifications();
const userService = new UserService();

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const { amount, to, comment } = JSON.parse(event.body);

		const from = event.user.phoneNumber;

		const targetUser = await userService.getSlug(to);
		console.log('targetUser>>', JSON.stringify(targetUser, null, 2));

		if (targetUser.phoneNumber !== from) {
			const res = await transactionsService.request(from, to, amount, comment);

			if (targetUser.pushToken) {
				await pushNotificationService.send(
					targetUser.pushToken,
					`User ${from} requested ${amount} USDT`
				);
			}
			return {
				statusCode: 201,
				body: JSON.stringify(res),
			};
		}
		throw new Error('Duplicated numbers');
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, { message: error.message });
		}
	}
};

export const createRequest = withAuthorization(handler);
