import { APIGatewayProxyHandler } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '@/services/auth/auth2';

export const authorization: APIGatewayProxyHandler = async (event) => {
	const authHeader = event.headers['Authorization'];
	const token = authHeader.split(' ')[1];
	if (!token) {
		return {
			statusCode: 401,
			body: 'No token',
		};
	}
	try {
		jwt.verify(token, JWT_SECRET_KEY);
	} catch (error: unknown) {
		console.log({ error });
		return {
			statusCode: 401,
			body: 'Not authorized',
		};
	}
};
