import { httpsPost } from '@/utils/httpPost';

export class PushNotifications {
	async send(to: string, title: string, body: string) {
		httpsPost({
			hostname: 'exp.host',
			path: '/--/api/v2/push/send',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to,
				title,
				sound: 'default',
				body,
			}),
		});
	}
}
