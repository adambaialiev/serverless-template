import { v4 } from 'uuid';
import {
	Entities,
	MonitoringAttributes,
	TableKeys,
	UserAttributes,
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
			[MonitoringAttributes.ID]: id,
			[MonitoringAttributes.EVENT_NAME]: eventName,
			[MonitoringAttributes.PLATFORM]: platform,
			[MonitoringAttributes.DEVICE_ID]: deviceId,
			[MonitoringAttributes.CREATED_AT]: date,
		};

		const response = await dynamoDB
			.update({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.MONITORING_USER,
					[TableKeys.SK]: buildMonitoringUserKey(id),
				},
				UpdateExpression:
					'SET #actions = list_append(if_not_exists(#actions, :emptyList), :event)',
				ExpressionAttributeNames: {
					'#actions': UserAttributes.WITHDRAWAL_ADDRESSES,
				},
				ExpressionAttributeValues: {
					':emptyList': [],
					':event': [newAction],
				},
				ReturnValues: 'UPDATED_NEW',
			})
			.promise();

		return response;
	}
}
