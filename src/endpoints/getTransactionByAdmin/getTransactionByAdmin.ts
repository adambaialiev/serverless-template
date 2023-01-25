import AWS from 'aws-sdk';
import { sendResponse } from '@/utils/makeResponse';
//import { TableKeys } from '@/common/dynamo/schema';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.dynamo_table as string;

export const getTransactions = async () => {
	try {
		const params = {
			TableName: tableName,
			FilterExpression: 'begins_with(SK, :sk)',
			ExpressionAttributeValues: {
				':sk': 'TRANSACTION#',
			},
		};

		const transactions = await dynamoDB.scan(params).promise();
		return sendResponse(200, { transactions: transactions.Items });
	} catch (error) {
		const message = error.message ? error.message : 'Internal server error';
		return sendResponse(500, { message });
	}
};
