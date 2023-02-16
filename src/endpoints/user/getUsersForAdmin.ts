import UserService from '@/services/user/user';
import { APIGatewayProxyHandler } from 'aws-lambda';

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const userService = new UserService();
		const users = userService.getUsersForAdmin();
		callback(null, {
			statusCode: 201,
			body: JSON.stringify(users),
		});
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const getUsersForAdmin = handler;
