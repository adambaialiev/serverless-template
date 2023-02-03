import BalanceService from '@/services/balance/balance';
import { httpsPost } from '@/utils/httpPost';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys } from '@/common/dynamo/schema';

const dynamoDB = new DynamoMainTable();

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber, amount } = JSON.parse(event.body as string);

		const balanceService = new BalanceService();
		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

		await balanceService.incrementBalance(phoneNumber, Number(amount));

		httpsPost({
			hostname: 'exp.host',
			path: '/--/api/v2/push/send',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: userOutput.Item.pushToken,
				title: `Shop wallet`,
				sound: 'default',
				body: `You recieved ${amount} USDT`,
			}),
		});

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
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

export const incrementUserBalance = handler;
