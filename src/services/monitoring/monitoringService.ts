import { v4 } from 'uuid';
import {
	MonitoringAttributes,
	TableKeys,
} from '@/common/dynamo/schema';
import { buildMonitoringUserKey } from '@/common/dynamo/buildKey';
import AWS from 'aws-sdk';

interface createProps {
	eventName: string;
	platform: string;
	deviceId: string;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export default class MonitoringService {
	async create({ eventName, platform, deviceId }: createProps) {
		const id = v4();
		const date = Date.now().toString();

		const newAction = {
			id,
			eventName,
			platform,
			deviceId,
			date,
		};

		const response = await dynamoDB
			.update({
				TableName,
				Key: {
					[TableKeys.PK]: buildMonitoringUserKey(deviceId),
					[TableKeys.SK]: buildMonitoringUserKey(deviceId),
				},
				UpdateExpression:
					'SET #actions = list_append(if_not_exists(#actions, :emptyList), :event)',
				ExpressionAttributeNames: {
					'#actions': MonitoringAttributes.ACTIONS,
				},
				ExpressionAttributeValues: {
					':emptyList': [],
					':event': [newAction],
				},
				ReturnValues: 'ALL_OLD',
			})
			.promise();

		return response;
	}
}
