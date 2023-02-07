import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys, UserItem } from '@/common/dynamo/schema';
import { httpsPost } from '@/utils/httpPost';

const dynamoDB = new DynamoMainTable();

export class PushNotifications {
	async send(phoneNumber: string, title: string, body: string) {
		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});
		if (userOutput.Item) {
			const user = userOutput.Item as UserItem;
			if (user.pushToken) {
				httpsPost({
					hostname: 'exp.host',
					path: '/--/api/v2/push/send',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						to: user.pushToken,
						title,
						sound: 'default',
						body,
					}),
				});
			}
		}
	}
}
