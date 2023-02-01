import { APIGatewayEvent } from 'aws-lambda';
import { AuthService } from '@/services/merchant/auth';
import { buildMerchantKey } from '@/common/dynamo/buildKey';
import { TableKeys } from '@/common/dynamo/schema';
import { sendResponse } from '@/utils/makeResponse';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';

const authService = new AuthService();
const dynamoDB = new DynamoMainTable();

export const signIn = async (event: APIGatewayEvent) => {
	try {
		const { phoneNumber } = JSON.parse(event.body as string);
		const merchantKey = buildMerchantKey(phoneNumber);

		const merchantOutput = await dynamoDB.getItem({
			[TableKeys.PK]: merchantKey,
			[TableKeys.SK]: merchantKey,
		});

		if (!merchantOutput.Item) {
			await authService.merchantSignUp(phoneNumber);
		}

		const response = await authService.merchantSignIn(phoneNumber);
		return sendResponse(201, response);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
