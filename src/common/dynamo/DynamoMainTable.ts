import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamoDBclient = new AWS.DynamoDB.DocumentClient();

export class DynamoMainTable {
	async putItem(params: Record<string, any>) {
		const TableName = process.env.dynamo_table as string;
		return dynamoDBclient
			.put({ Item: { ...params, id: v4() }, TableName })
			.promise();
	}
	async getItem(params: Record<string, any>) {
		const TableName = process.env.dynamo_table as string;
		return dynamoDBclient.get({ TableName, Key: params }).promise();
	}
}
