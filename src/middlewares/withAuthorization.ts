import { APIGatewayProxyHandler } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '@/services/auth/auth';

export const withAuthorization =
	(handler: APIGatewayProxyHandler): APIGatewayProxyHandler =>
	async (event, context, callback) => {
		const authHeader = event.headers['Authorization'];
		if (!authHeader) {
			return {
				statusCode: 401,
				body: 'Unauthorized',
			};
		}
		const token = authHeader.split(' ')[1];
		try {
			jwt.verify(token, JWT_SECRET_KEY);
			await handler(event, context, callback);
		} catch (error: unknown) {
			console.log({ error });
			if (error instanceof Error) {
				return {
					statusCode: 401,
					body: error.message,
				};
			}
		}
	};
