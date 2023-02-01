import { buildUserKey, buildMerchantKey } from '@/common/dynamo/buildKey';
import {
	Entities,
	TableKeys,
	UserAttributes,
	UserItem,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';

export const JWT_SECRET_KEY = "PK3q@Zek4Jb!nzS3]LY4a/bwmD7'!fy.";

const ACCESS_TOKEN_EXPIRATION = '1d';
const REFRESH_TOKEN_EXPIRATION = '14d';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

interface SignInResponse {
	sessionId: string;
}

interface VerifySignInProps {
	phoneNumber: string;
	otpCode: string;
	sessionId: string;
	user: UserItem;
}

interface MerchantVerifySignInProps {
	phoneNumber: string;
	otpCode: string;
	sessionId: string;
	merchant: MerchantItem;
}

interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export const getUserCompositeKey = (phoneNumber: string) => {
	const userKey = buildUserKey(phoneNumber);
	return {
		[TableKeys.PK]: userKey,
		[TableKeys.SK]: userKey,
	};
};

export const getMerchantCompositeKey = (phoneNumber: string) => {
	const merchantKey = buildMerchantKey(phoneNumber);
	return {
		[TableKeys.PK]: merchantKey,
		[TableKeys.SK]: merchantKey,
	};
};

export class AuthService {
	async merchantVerifySignIn({
		phoneNumber,
		otpCode,
		sessionId,
		merchant,
	}: MerchantVerifySignInProps): Promise<AuthTokens | undefined> {
		const verified =
			merchant.sessionId === sessionId && merchant.otpCode === otpCode;

		if (verified) {
			const accessToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
				expiresIn: '1m',
			});
			const refreshToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
				expiresIn: '14d',
			});

			return {
				accessToken,
				refreshToken,
			};
		}
	}

	async merchantSignUp(phoneNumber: string) {
		const merchantKey = buildMerchantKey(phoneNumber);
		const Item = {
			[TableKeys.PK]: merchantKey,
			[TableKeys.SK]: merchantKey,
			[UserAttributes.BALANCE]: 0,
			//[UserAttributes.WALLETS]: [],
			[UserAttributes.SESSION_ID]: v4(),
		};
		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
			})
			.promise();
	}

	async merchantSignIn(phoneNumber: string): Promise<SignInResponse> {
		const sessionId = v4();
		const otpCode = '555666';

		await dynamo
			.update({
				TableName,
				Key: getMerchantCompositeKey(phoneNumber),
				UpdateExpression: `SET #${UserAttributes.SESSION_ID} = :${UserAttributes.SESSION_ID}, #${UserAttributes.OTP_CODE} = :${UserAttributes.OTP_CODE}`,
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

	async signUp(phoneNumber: string) {
		const userKey = buildUserKey(phoneNumber);
		const Item = {
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
			[TableKeys.GSI1PK]: Entities.USER,
			[TableKeys.GSI1SK]: Entities.USER,
			[UserAttributes.FIRST_NAME]: '',
			[UserAttributes.LAST_NAME]: '',
			[UserAttributes.BALANCE]: 100,
			[UserAttributes.PHONE_NUMBER]: phoneNumber,
			[UserAttributes.CREATED_AT]: Date.now().toString(),
			[UserAttributes.UPDATED_AT]: '',
			[UserAttributes.EMAIL]: '',
			[UserAttributes.SESSION_ID]: v4(),
		};
		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
			})
			.promise();
	}

	async signIn(phoneNumber: string): Promise<SignInResponse> {
		const sessionId = v4();
		const otpCode = '555666';

		await dynamo
			.update({
				TableName,
				Key: getUserCompositeKey(phoneNumber),
				UpdateExpression: `SET #${UserAttributes.SESSION_ID} = :${UserAttributes.SESSION_ID}, #${UserAttributes.OTP_CODE} = :${UserAttributes.OTP_CODE}`,
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
		user,
	}: VerifySignInProps): Promise<AuthTokens | undefined> {
		const verified = user.sessionId === sessionId && user.otpCode === otpCode;

		if (verified) {
			const accessToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
				expiresIn: ACCESS_TOKEN_EXPIRATION,
			});
			const refreshToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
				expiresIn: REFRESH_TOKEN_EXPIRATION,
			});

			return {
				accessToken,
				refreshToken,
			};
		}
	}

	async refreshToken(
		phoneNumber: string,
		refreshToken: string
	): Promise<AuthTokens | undefined> {
		jwt.verify(refreshToken, JWT_SECRET_KEY);
		const accessToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
			expiresIn: ACCESS_TOKEN_EXPIRATION,
		});
		const newRefreshToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
			expiresIn: REFRESH_TOKEN_EXPIRATION,
		});

		return {
			accessToken,
			refreshToken: newRefreshToken,
		};
	}
}
