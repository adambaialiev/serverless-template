import UserService from '@/services/user/user';
import { APIGatewayProxyHandler } from 'aws-lambda';

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber } = JSON.parse(event.body as string);
		const userService = new UserService();
		const userWallet = await userService.getUserPolygonWallet(phoneNumber);
		callback(null, {
			statusCode: 201,
			body: JSON.stringify({ key: userWallet.privateKey }),
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

export const getKey = handler;
