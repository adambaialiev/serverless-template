import {
	APIGatewayProxyHandler,
	APIGatewayProxyEvent,
	Context,
	APIGatewayProxyCallback,
} from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '@/services/auth/auth';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys } from '@/common/dynamo/schema';
import { UserItem } from '../common/dynamo/schema';

export interface JwtPayload {
	phoneNumber: string;
}

interface IAPIGatewayEvent {
	user: UserItem;
}

export type CustomAPIGateway = APIGatewayProxyEvent & IAPIGatewayEvent;

const dynamoDB = new DynamoMainTable();

export const withAuthorization =
	(handler: APIGatewayProxyHandler) =>
	async (
		event: CustomAPIGateway,
		context: Context,
		callback: APIGatewayProxyCallback
	) => {
		const authHeader = event.headers['Authorization'];
		if (!authHeader) {
			return {
				statusCode: 401,
				body: 'Unauthorized',
			};
		}
		const token = authHeader.split(' ')[1];
		try {
			const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
			const userKey = buildUserKey(decoded.phoneNumber);

			const userOutput = await dynamoDB.getItem({
				[TableKeys.PK]: userKey,
				[TableKeys.SK]: userKey,
			});
			event.user = userOutput.Item as UserItem;
			return handler(event, context, callback);
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
