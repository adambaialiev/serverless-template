import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';
import { AuthService } from '../../authService';
const authService = new AuthService();

export const refreshTokenHandler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { refreshToken } = JSON.parse(event.body as string);

		const refreshTokenResponse = await authService.refreshToken(refreshToken);

		callback(null, {
			statusCode: 200,
			body: JSON.stringify(refreshTokenResponse),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(error);
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};
