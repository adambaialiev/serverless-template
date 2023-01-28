import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys } from '@/common/dynamo/schema';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';

const dynamoDB = new DynamoMainTable();

export const getUser = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber } = event.pathParameters;

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
