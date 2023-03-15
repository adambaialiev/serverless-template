import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';
import { TransactionRequestService } from '@/services/transactionRequest/transactionRequest';

const requestService = new TransactionRequestService();
const pushNotificationService = new PushNotifications();
const userService = new UserService();

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const { phoneNumber } = JSON.parse(event.body);
		const { id } = event.pathParameters;

		const source = event.user;

		const userTarget = await userService.getSlug(phoneNumber);

		const res = await requestService.decline(
			source.phoneNumber,
			phoneNumber,
			id
		);

		if (userTarget.pushToken) {
			await pushNotificationService.send({
				pushToken: userTarget.pushToken,
				body: `User ${source.phoneNumber} declined your request`,
				badgeCount: userTarget.unreadNotifications,
				from: source.phoneNumber,
			});
		}

		return sendResponse(200, res);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, { message: error.message });
		}
	}
};

export const declineRequest = withAuthorization(handler);
