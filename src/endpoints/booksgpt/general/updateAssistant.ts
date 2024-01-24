import { buildAssistantKey, buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys } from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import {
	ExpressionAttributeNameMap,
	ExpressionAttributeValueMap,
} from 'aws-sdk/clients/dynamodb';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export default async function updateAssistant(
	userId: string,
	assistantId: string,
	UpdateExpression: string,
	ExpressionAttributeNames: ExpressionAttributeNameMap,
	ExpressionAttributeValues: ExpressionAttributeValueMap
) {
	await dynamo
		.update({
			TableName,
			Key: {
				[TableKeys.PK]: buildUserKey(userId),
				[TableKeys.SK]: buildAssistantKey(assistantId),
			},
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		})
		.promise();
}
