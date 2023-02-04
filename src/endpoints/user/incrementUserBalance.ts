import BalanceService from '@/services/balance/balance';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys, UserItem } from '@/common/dynamo/schema';
import { PushNotifications } from '@/services/pushNotifications/pushNotification';

const dynamoDB = new DynamoMainTable();
const pushNotificationService = new PushNotifications();

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber, amount } = JSON.parse(event.body as string);
		console.log({ phoneNumber, amount });
		const balanceService = new BalanceService();
		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

		await balanceService.incrementBalance(phoneNumber, Number(amount));
		if (userOutput.Item) {
			const user = userOutput.Item as UserItem;
			if (user.pushToken) {
				await pushNotificationService.send(
					userOutput.Item.pushToken,
					'Shop wallet',
					`You recieved ${amount} USDT`
				);
			}
		}

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const incrementUserBalance = handler;
