import { v4 } from 'uuid';
import {
	Entities,
	MonitoringAttributes,
	TableKeys,
} from '@/common/dynamo/schema';
import { buildMonitoringUserKey } from '@/common/dynamo/buildKey';
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

interface createProps {
	eventName: string;
	platform: string;
	deviceId: string;
}

export default class MonitoringService {
	async create({ eventName, platform, deviceId }: createProps) {
		const id = v4();

		const date = Date.now().toString();

		const Item = {
			[TableKeys.PK]: Entities.MONITORING_USER,
			[TableKeys.SK]: buildMonitoringUserKey(id),
			[MonitoringAttributes.ID]: id,
			[MonitoringAttributes.EVENT_NAME]: eventName,
			[MonitoringAttributes.PLATFORM]: platform,
			[MonitoringAttributes.DEVICE_ID]: deviceId,
			[MonitoringAttributes.CREATED_AT]: date,
		};

		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		return 'Success';
	}
}
