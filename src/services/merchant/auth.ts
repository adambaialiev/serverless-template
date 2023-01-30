import { buildMerchantKey } from '@/common/dynamo/buildKey';
import {
	MerchantItem,
	TableKeys,
	UserAttributes,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';

export const JWT_SECRET_KEY = "PK3q@Zek4Jb!nzS3]LY4a/bwmD7'!fy.";

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

interface MerchantSignInResponse {
	sessionId: string;
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

	async merchantSignIn(phoneNumber: string): Promise<MerchantSignInResponse> {
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
	async isMerchantKey(apiKey: string) {
		const params = {
			TableName,
			Key: {
				SK: apiKey,
			},
		};
		try {
			await dynamo.scan(params).promise();
			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}
	async refreshToken(
		phoneNumber: string,
		refreshToken: string
	): Promise<AuthTokens | undefined> {
		jwt.verify(refreshToken, JWT_SECRET_KEY);
		const accessToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
			expiresIn: '1m',
		});
		const newRefreshToken = jwt.sign({ phoneNumber }, JWT_SECRET_KEY, {
			expiresIn: '14d',
		});

		return {
			accessToken,
			refreshToken: newRefreshToken,
		};
	}
}
