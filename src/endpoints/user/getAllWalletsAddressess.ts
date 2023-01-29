import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { Entities, TableKeys, UserItem } from '@/common/dynamo/schema';
import { withAuthorization } from '@/middlewares/withAuthorization';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const dynamoDb = new DocumentClient();

export const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const output = await dynamoDb
			.query({
				TableName: process.env.dynamo_table as string,
				KeyConditionExpression: 'begins_with(#pk, :pk)',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.USER,
				},
			})
			.promise();

		if (output.Items) {
			const users = output.Items as UserItem[];
		}

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(userOutput.Item),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const getUser = withAuthorization(handler);
