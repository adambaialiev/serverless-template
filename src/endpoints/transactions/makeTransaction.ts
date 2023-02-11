import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import BalanceService from '@/services/balance/balance';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import UserService from '@/services/user/user';
import { APIGatewayProxyHandler } from 'aws-lambda';

const pushNotificationService = new PushNotifications();

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const { to, amount, comment } = JSON.parse(event.body as string);
		const from = event.user.phoneNumber;

		const balanceService = new BalanceService();
		const userService = new UserService();

		const source = await userService.getSlug(from);
		console.log('event', JSON.stringify(event, null, 2));

		if (Number(source.balance) < Number(amount)) {
			throw new Error('Not enough money');
		}

		const target = await userService.getSlug(to);

		if (target) {
			if (from === target.phoneNumber) {
				throw new Error('Source number and target number are the same');
			}
			const balanceServiceOutput = await balanceService.makeTransaction(
				source,
				target,
				Number(amount),
				comment
			);
			if (target.pushToken) {
				await pushNotificationService.send(
					target.pushToken,
					'Shop wallet',
					`You recieved ${amount} USDT`
				);
			}
			return {
				statusCode: 201,
				body: JSON.stringify(balanceServiceOutput),
			};
		}
		throw new Error('This user in not registered in our system');
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: JSON.stringify({ message: error.message }),
			};
		}
	}
};

export const makeTransaction = withAuthorization(handler);
