import axios from 'axios';
import AWS from 'aws-sdk';
import { getUserCompositeKey } from '../auth/auth';
import { UserAttributes, UserItem } from '@/common/dynamo/schema';

const dynamo = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table;

export class PushNotifications {
	async incrementBadgeCount(phoneNumber: string) {
		return (
			await dynamo
				.update({
					TableName,
					Key: getUserCompositeKey(phoneNumber),
					UpdateExpression: `SET #unreadNotifications = #unreadNotifications + :increment`,
					ExpressionAttributeNames: {
						'#unreadNotifications': UserAttributes.UNREAD_NOTIFICATIONS,
					},
					ExpressionAttributeValues: {
						':increment': 1,
					},
					ReturnValues: 'ALL_NEW',
				})
				.promise()
		).Attributes as UserItem;
	}
	async send(pushToken: string, body: string, badgeCount: number) {
		await axios.post(
			'https://exp.host/--/api/v2/push/send',
			{
				to: pushToken,
				title: 'Shop Wallet',
				sound: 'default',
				body,
				badge: badgeCount,
			},
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
	async decrementBadgeCount(user: UserItem) {
		if (Number(user.unreadNotifications) !== 0) {
			const response = await dynamo
				.update({
					TableName,
					Key: getUserCompositeKey(user.phoneNumber),
					UpdateExpression: `SET #unreadNotifications = #unreadNotifications - :decrement`,
					ExpressionAttributeNames: {
						'#unreadNotifications': UserAttributes.UNREAD_NOTIFICATIONS,
					},
					ExpressionAttributeValues: {
						':decrement': 1,
					},
					ReturnValues: 'ALL_NEW',
				})
				.promise();

			return response.Attributes;
		}
		return user;
	}
}
