import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamoDBclient = new AWS.DynamoDB.DocumentClient();

export class DynamoDB {
  async putItem(TableName: string, params: Record<string, any>) {
    return dynamoDBclient
      .put({ Item: { ...params, id: v4() }, TableName })
      .promise();
  }
  async getItem(TableName: string, params: Record<string, any>) {
    return dynamoDBclient.get({ TableName, Key: params }).promise();
  }
}
