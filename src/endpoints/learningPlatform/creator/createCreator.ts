import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { Entities, CreatorAttributes, TableKeys } from '@/common/dynamo/schema';
import { buildCreatorKey } from '@/common/dynamo/buildKey';
import KSUID from 'ksuid';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.learning_platform_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { name } = JSON.parse(event.body);

		const id = KSUID.randomSync().string;
		const Item = {
			[TableKeys.PK]: Entities.CREATOR,
			[TableKeys.SK]: buildCreatorKey(id),
			[CreatorAttributes.ID]: id,
			[CreatorAttributes.NAME]: name,
			[CreatorAttributes.CREATED_AT]: Date.now().toString(),
		};

		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		return sendResponse(201, true);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
