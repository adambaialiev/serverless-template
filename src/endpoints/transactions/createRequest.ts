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
		const { amount, to, comment } = JSON.parse(event.body);

		const from = event.user.phoneNumber;

		const target = await userService.getSlug(to);

		if (target.phoneNumber !== from) {
			const res = await requestService.request({
				amount: Number(amount),
				source: from,
				target: target.phoneNumber,
				comment,
			});

			if (target.pushToken) {
				const updatedUser = await pushNotificationService.incrementBadgeCount(
					target.phoneNumber
				);
				await pushNotificationService.send({
					pushToken: target.pushToken,
					body: `User ${from} requested ${amount} USDT`,
					badgeCount: Number(updatedUser.unreadNotifications),
					from,
				});
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
