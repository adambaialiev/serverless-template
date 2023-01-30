import { ApiKey } from '@/services/merchant/api-key';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';
import { v4 } from 'uuid';

const apiKey = new ApiKey();

export const createApiKey = async (event: APIGatewayEvent) => {
	const { phoneNumber } = JSON.parse(event.body as string);
	const output = await apiKey.GetApiKey(phoneNumber);
	if (output) {
		return sendResponse(200, { output });
	}
	const key = v4();
	const res = await apiKey.CreateApiKey({ phoneNumber, key });
	return sendResponse(200, { res });
};
