import { APIGatewayEvent } from 'aws-lambda';
import { AuthService } from '@/services/auth/auth';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys } from '@/common/dynamo/schema';
import { sendResponse } from '@/utils/makeResponse';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';

const authService = new AuthService();
const dynamoDB = new DynamoMainTable();

export const signIn = async (event: APIGatewayEvent) => {
	try {
		const { phoneNumber } = JSON.parse(event.body as string);
		console.log({ phoneNumber });
		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

		if (!userOutput.Item) {
			await authService.signUp(phoneNumber);
		}

		const res = await authService.signIn(phoneNumber);
		return sendResponse(201, res);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
