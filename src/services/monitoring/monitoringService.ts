import { v4 } from 'uuid';
import { MonitoringAttributes, TableKeys } from '@/common/dynamo/schema';
import { buildMonitoringUserKey } from '@/common/dynamo/buildKey';
import AWS from 'aws-sdk';

interface createProps {
	eventName: string;
	metaData: {
		platform: string;
		deviceId: string;
		osVersion: string;
		modelName: string;
	};
}

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export default class MonitoringService {
	async create({ eventName, metaData }: createProps) {
		const id = v4();
		const date = Date.now().toString();

		const newAction = {
			id,
			eventName,
			date,
			metaData,
		};

		await dynamoDB
			.update({
				TableName,
				Key: {
					[TableKeys.PK]: buildMonitoringUserKey(metaData.deviceId),
					[TableKeys.SK]: buildMonitoringUserKey(metaData.deviceId),
				},
				UpdateExpression:
					'SET #events = list_append(if_not_exists(#events, :emptyList), :event)',
				ExpressionAttributeNames: {
					'#events': MonitoringAttributes.ACTIONS,
				},
				ExpressionAttributeValues: {
					':emptyList': [],
					':event': [newAction],
				},
			})
			.promise();

		return 'Success';
	}
}
