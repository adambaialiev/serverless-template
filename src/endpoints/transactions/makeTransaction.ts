import { withAuthorization } from '@/middlewares/withAuthorization';
import BalanceService from '@/services/balance/balance';
import UserService from '@/services/user/user';
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda';
const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { from, to, amount } = JSON.parse(event.body as string);

		const balanceService = new BalanceService();
		const userService = new UserService();

		const source = await userService.getSlug(from);
		console.log('event', JSON.stringify(event, null, 2));

		const target = await userService.getSlug(to);
		let balanceServiceOutput;
		if (source && target) {
			balanceServiceOutput = await balanceService.makeTransaction(
				source,
				target,
				Number(amount)
			);
		}

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(balanceServiceOutput),
		});
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

export const makeTransaction = withAuthorization(handler);
