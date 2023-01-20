import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoDB } from '@/common/dynamo/Dynamo';
import { TableKeys } from '@/common/dynamo/schema';
import { AuthService } from '@/services/auth/auth';
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';

const authService = new AuthService();
const dynamoDB = new DynamoDB();
export const signInVerify = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber, passCode, session } = JSON.parse(event.body as string);
		const tableName = process.env.dynamo_table as string;
		const userKey = buildUserKey(phoneNumber);

		const res = await authService.verifySignIn(passCode, phoneNumber, session);

		const userOutput = await dynamoDB.getItem(tableName, {
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

		callback(null, {
			statusCode: 201,
			body: JSON.stringify({
				...res,
				user: userOutput.Item,
			}),
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
