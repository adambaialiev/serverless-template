import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys, UserItem } from '@/common/dynamo/schema';
import { AuthService } from '@/services/auth/auth2';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';

const authService = new AuthService();
const dynamoDB = new DynamoMainTable();
export const signInVerify = async (event: APIGatewayEvent) => {
	try {
		const { phoneNumber, otpCode, sessionId } = JSON.parse(
			event.body as string
		);
		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

		const res = await authService.verifySignIn({
			phoneNumber,
			otpCode,
			sessionId,
			user: userOutput.Item as UserItem,
		});

		if (userOutput.Item && res) {
			const user = userOutput.Item as UserItem;
			return sendResponse(201, { ...res, user });
		}
		return sendResponse(500, { message: 'user is not found' });
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
