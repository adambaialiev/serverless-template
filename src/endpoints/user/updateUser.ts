import { APIGatewayProxyHandler } from 'aws-lambda';
import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import UserService from '@/services/user/user';

const userService = new UserService();

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const { firstName, lastName, email } = JSON.parse(event.body);

		const phoneNumber = event.user.phoneNumber;

		const updatedResponse = await userService.update({
			firstName,
			email,
			lastName,
			phoneNumber,
		});

		return sendResponse(200, updatedResponse);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const updateUser = withAuthorization(handler);
