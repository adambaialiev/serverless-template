import { AuthService } from '../../authService';
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';

const authService = new AuthService();

export const signInVerify = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber, passCode, session } = JSON.parse(event.body as string);

		const res = await authService.verifySignIn(passCode, phoneNumber, session);

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(res),
		});
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
