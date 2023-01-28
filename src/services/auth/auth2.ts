import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys, UserAttributes, UserItem } from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "PK3q@Zek4Jb!nzS3]LY4a/bwmD7'!fy.";

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

interface SignInResponse {
	sessionId: string;
}

interface VerifySignInProps {
	phoneNumber: string;
	otpCode: string;
	sessionId: string;
}

interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

const getUserCompositeKey = (phoneNumber: string) => {
	const userKey = buildUserKey(phoneNumber);
	return {
		[TableKeys.PK]: userKey,
		[TableKeys.SK]: userKey,
	};
};

export class AuthService {
	async signUp(phoneNumber: string) {
		const userKey = buildUserKey(phoneNumber);
		const Item = {
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
			[UserAttributes.FIRST_NAME]: '',
			[UserAttributes.LAST_NAME]: '',
			[UserAttributes.BALANCE]: 100,
			[UserAttributes.PHONE_NUMBER]: phoneNumber,
			[UserAttributes.CREATED_AT]: Date.now().toString(),
			[UserAttributes.UPDATED_AT]: '',
			[UserAttributes.EMAIL]: '',
			[UserAttributes.SESSION_ID]: v4(),
		};
		await dynamo.put({
			Item,
			TableName,
			ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
		});
	}

	async signIn(phoneNumber: string): Promise<SignInResponse> {
		const sessionId = v4();
		const otpCode = '555666';

		await dynamo
			.update({
				TableName,
				Key: getUserCompositeKey(phoneNumber),
				UpdateExpression: `SET #${UserAttributes.SESSION_ID} = :${UserAttributes.SESSION_ID} SET #${UserAttributes.OTP_CODE} = :${UserAttributes.OTP_CODE}`,
				ExpressionAttributeNames: {
					[`#${UserAttributes.SESSION_ID}`]: UserAttributes.SESSION_ID,
					[`#${UserAttributes.OTP_CODE}`]: UserAttributes.OTP_CODE,
				},
				ExpressionAttributeValues: {
					[`:${UserAttributes.SESSION_ID}`]: sessionId,
					[`:${UserAttributes.OTP_CODE}`]: otpCode,
				},
			})
			.promise();

		return { sessionId };
	}

	async verifySignIn({
		phoneNumber,
		otpCode,
		sessionId,
	}: VerifySignInProps): Promise<AuthTokens | undefined> {
		const output = await dynamo
			.get({
				TableName,
				Key: getUserCompositeKey(phoneNumber),
			})
			.promise();

		if (output.Item) {
			const userItem = output.Item as UserItem;
			const verified =
				userItem.sessionId === sessionId && userItem.otpCode === otpCode;

			if (verified) {
				const accessToken = jwt.sign({ phoneNumber }, SECRET_KEY, {
					expiresIn: '1h',
				});
				const refreshToken = jwt.sign({ phoneNumber }, SECRET_KEY, {
					expiresIn: '14d',
				});

				return {
					accessToken,
					refreshToken,
				};
			}
		}
	}

	async refreshToken(
		phoneNumber: string,
		refreshToken: string
	): Promise<AuthTokens | undefined> {
		jwt.verify(refreshToken, SECRET_KEY);
		const accessToken = jwt.sign({ phoneNumber }, SECRET_KEY, {
			expiresIn: '1h',
		});
		const newRefreshToken = jwt.sign({ phoneNumber }, SECRET_KEY, {
			expiresIn: '14d',
		});

		return {
			accessToken,
			refreshToken: newRefreshToken,
		};
	}
}
