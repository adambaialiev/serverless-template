import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys, UserItem } from '@/common/dynamo/schema';
import { AuthService } from '@/services/auth/auth';
import { CryptoService } from '@/services/crypto/crypto';
import UserService from '@/services/user/user';
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

		if (userOutput.Item) {
			const userItem = userOutput.Item as UserItem;
			const authTokens = await authService.verifySignIn({
				phoneNumber,
				otpCode,
				sessionId,
				user: userItem,
			});

			if (typeof authTokens === 'string') {
				return sendResponse(500, authTokens);
			}

			const cryptoService = new CryptoService();
			const userService = new UserService();

			let user = await userService.getUser(phoneNumber);

			if (!user.wallets || !user.wallets.length) {
				await cryptoService.createCryptoWallet(phoneNumber);
				user = await userService.getUser(phoneNumber);
			}

			return sendResponse(201, { ...authTokens, user });
		}

		return sendResponse(500, { message: 'user is not found' });
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return sendResponse(500, { message: error.message });
		}
	}
};
