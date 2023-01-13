import { AuthService } from '../../authService';
import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';

const authService = new AuthService();

export const signUp = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		console.log('Received event:', JSON.stringify(event, null, 2));
		const { phoneNumber } = JSON.parse(event.body as string);

		const res = await authService.signUp(phoneNumber);

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
