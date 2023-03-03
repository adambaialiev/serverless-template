import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';
import { TransactionService } from '@/services/transaction/transactionService';
import UserService from '@/services/user/user';
import { APIGatewayProxyHandler } from 'aws-lambda';

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	const transactionsService = new TransactionService();
	const userService = new UserService();
	const pushNotificationService = new PushNotifications();
	try {
		const { to, amount, comment } = JSON.parse(event.body as string);
		const from = event.user.phoneNumber;

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
			const balanceServiceOutput = await transactionsService.makeTransaction({
				target,
				source,
				amount,
				comment,
			});
			if (target.pushToken) {
				const updatedUser = await pushNotificationService.incrementBadgeCount(
					target.phoneNumber
				);
				await pushNotificationService.send(
					target.pushToken,
					`You received ${amount} USDT`,
					Number(updatedUser.unreadNotifications)
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
