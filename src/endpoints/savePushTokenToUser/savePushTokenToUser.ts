import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { getUserCompositeKey } from '@/services/auth/auth';
import { UserAttributes } from '@/common/dynamo/schema';
import { withAuthorization } from '@/middlewares/withAuthorization';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const { phoneNumber, pushToken } = JSON.parse(event.body as string);

		const params = {
			TableName,
			Key: getUserCompositeKey(phoneNumber),
			UpdateExpression: `SET #pushToken = :pushToken`,
			ExpressionAttributeNames: {
				'#pushToken': UserAttributes.PUSH_TOKEN,
			},
			ExpressionAttributeValues: {
				':pushToken': pushToken,
			},
		};

		await dynamoDB.update(params).promise();
		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const savePushTokenToUser = withAuthorization(handler);
