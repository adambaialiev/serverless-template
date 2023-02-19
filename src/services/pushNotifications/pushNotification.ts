import axios from 'axios';

export class PushNotifications {
	async send(pushToken: string, body: string) {
		await axios.post(
			'https://exp.host/--/api/v2/push/send',
			{
				to: pushToken,
				title: 'Shop Wallet',
				sound: 'default',
				body,
			},
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
