import { buildApiKey } from '@/common/dynamo/buildKey';
import BalanceService from '@/services/balance/balance';
import { AuthService } from '@/services/merchant/auth';
import UserService from '@/services/user/user';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';

const merchantAuth = new AuthService();

export const preTransaction = async (event: APIGatewayEvent) => {
	try {
		const { apiKey } = event.pathParameters;
		const merchantKey = buildApiKey(apiKey);
		const dynamoOutput = await merchantAuth.isMerchantKey(merchantKey);
		if (!dynamoOutput) {
			return sendResponse(404, { message: 'invalid merchant api key' });
		}
		const { from, to, amount } = JSON.parse(event.body as string);
		const balanceService = new BalanceService();
		const userService = new UserService();

		const source = await userService.getSlug(from);
		console.log('event', JSON.stringify(event, null, 2));

		const target = await userService.getSlug(to);
		let balanceServiceOutput;
		if (source && target) {
			balanceServiceOutput = await balanceService.preTransaction(
				source,
				target,
				amount
			);
		}
		return sendResponse(201, { status: balanceServiceOutput });
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};
