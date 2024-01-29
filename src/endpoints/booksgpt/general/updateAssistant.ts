/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildAssistantKey } from '@/common/dynamo/buildKey';
import { Entities, TableKeys } from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export default async function updateAssistant(
	assistantId: string,
	UpdateExpression: string,
	ExpressionAttributeNames: ExpressionAttributeNameMap,
	ExpressionAttributeValues: { [key: string]: any }
) {
	await dynamo
		.update({
			TableName,
			Key: {
				[TableKeys.PK]: Entities.ASSISTANT,
				[TableKeys.SK]: buildAssistantKey(assistantId),
			},
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		})
		.promise();
}
