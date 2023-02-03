import { APIGatewayProxyHandler } from 'aws-lambda';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys } from '@/common/dynamo/schema';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';

const dynamoDB = new DynamoMainTable();

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway,
	context,
	callback
) => {
	try {
		const { phoneNumber } = event.pathParameters;
		console.log('event', JSON.stringify(event, null, 2));

		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem({
			[TableKeys.PK]: userKey,
			[TableKeys.SK]: userKey,
		});

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
