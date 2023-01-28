import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys } from '@/common/dynamo/schema';
import { AuthService } from '@/services/auth/auth';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';

const authService = new AuthService();
const dynamoDB = new DynamoMainTable();
export const signInVerify = async (event: APIGatewayEvent) => {
	try {
		const { phoneNumber, passCode, session } = JSON.parse(event.body as string);
		const userKey = buildUserKey(phoneNumber);

		const res = await authService.verifySignIn(passCode, phoneNumber, session);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});
		return sendResponse(201, { ...res, user: userOutput.Item });
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
