import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';
import { AuthService } from '@/services/auth/auth';
import { DynamoDB } from '@/common/dynamo/Dynamo';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys } from '@/common/dynamo/schema';

const authService = new AuthService();
const dynamoDB = new DynamoDB();

export const signIn = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber } = JSON.parse(event.body as string);
		const tableName = process.env.dynamo_table as string;
		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem(tableName, {
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

		if (!userOutput.Item) {
			await authService.signUp(phoneNumber);
		}

		const res = await authService.signIn(phoneNumber);

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
