import { MonitoringAttributes, TableKeys } from '@/common/dynamo/schema';
import {
	buildMonitoringSessionKey,
	buildMonitoringUserAndroidKey,
	buildMonitoringUserIosKey,
} from '@/common/dynamo/buildKey';
import AWS from 'aws-sdk';

export interface MonitoringPayload {
	payload: {
		events: { type: string; timestamp: string; metaInfo: any }[];
		deviceInfo: {
			description: string;
			systemName?: string;
			systemVersion?: string;
			model?: string;
			name?: string;
		};
		userId: string;
		sessionId: string;
		platform: 'ios' | 'android';
	};
}

export default class MonitoringService {
	async create(country: string, { payload }: MonitoringPayload) {
		const { events, deviceInfo, userId, sessionId, platform } = payload;

		const dynamoDB = new AWS.DynamoDB.DocumentClient();
		const TableName = process.env.dynamo_table as string;

		await dynamoDB
			.update({
				TableName,
				Key: {
					[TableKeys.PK]:
						platform === 'ios'
							? buildMonitoringUserIosKey(userId)
							: buildMonitoringUserAndroidKey(userId),
					[TableKeys.SK]: buildMonitoringSessionKey(sessionId),
				},
				UpdateExpression:
					'SET #events = :events, #deviceInfo = :deviceInfo, #userId = :userId, #sessionId = :sessionId, #country = :country',
				ExpressionAttributeNames: {
					'#events': MonitoringAttributes.EVENTS,
					'#deviceInfo': MonitoringAttributes.DEVICE_INFO,
					'#userId': MonitoringAttributes.USER_ID,
					'#sessionId': MonitoringAttributes.SESSION_ID,
					'#country': MonitoringAttributes.COUNTRY,
				},
				ExpressionAttributeValues: {
					':emptyList': [],
					':events': events,
					':deviceInfo': deviceInfo,
					':userId': userId,
					':sessionId': sessionId,
					':country': country,
				},
			})
			.promise();

		return 'Success';
	}
}
