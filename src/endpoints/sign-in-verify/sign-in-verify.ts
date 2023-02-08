import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys, UserItem } from '@/common/dynamo/schema';
import { AuthService } from '@/services/auth/auth';
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

		let verifyResponse;

		if (userOutput.Item) {
			verifyResponse = await authService.verifySignIn({
				phoneNumber,
				otpCode,
				sessionId,
				user: userOutput.Item as UserItem,
			});
		}

		if (verifyResponse && typeof verifyResponse !== 'string') {
			const user = userOutput.Item as UserItem;
			return sendResponse(201, { ...verifyResponse, user });
		}
		return sendResponse(500, verifyResponse);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
