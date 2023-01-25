import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoDB } from '@/common/dynamo/Dynamo';
import { TableKeys } from '@/common/dynamo/schema';
const dynamoDB = new DynamoDB();

export const getUser = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
		const { phoneNumber } = event.pathParameters;
		const tableName = process.env.dynamo_table as string;

		const userKey = buildUserKey(phoneNumber);

		const userOutput = await dynamoDB.getItem(tableName, {
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
