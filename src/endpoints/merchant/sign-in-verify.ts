import { buildMerchantKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { MerchantItem, TableKeys } from '@/common/dynamo/schema';
import { AuthService } from '@/services/merchant/auth';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';

const authService = new AuthService();
const dynamoDB = new DynamoMainTable();
export const signInVerify = async (event: APIGatewayEvent) => {
	try {
		const { phoneNumber, otpCode, sessionId } = JSON.parse(
			event.body as string
		);
		const merchantKey = buildMerchantKey(phoneNumber);

		const merchantOutput = await dynamoDB.getItem({
			[TableKeys.PK]: merchantKey,
			[TableKeys.SK]: merchantKey,
		});

		const res = await authService.merchantVerifySignIn({
			phoneNumber,
			otpCode,
			sessionId,
			merchant: merchantOutput.Item as MerchantItem,
		});

		if (merchantOutput.Item && res) {
			const user = merchantOutput.Item as MerchantItem;
			return sendResponse(201, { ...res, user });
		}
		return sendResponse(500, { message: 'merchant is not found' });
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
