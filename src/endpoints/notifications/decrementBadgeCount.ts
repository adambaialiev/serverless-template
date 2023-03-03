import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';

const pushNotificationService = new PushNotifications();

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const user = event.user;

		const updatedUser = await pushNotificationService.decrementBadgeCount(user);

		return sendResponse(200, updatedUser);
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const decrementBadgeCount = withAuthorization(handler);
