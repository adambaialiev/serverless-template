import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { Entities, TableKeys, CourseAttributes } from '@/common/dynamo/schema';
import { buildCourseKey } from '@/common/dynamo/buildKey';
import KSUID from 'ksuid';
import { buildFileUrl } from '../utils';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.learning_platform_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { name, imageKey, authorId } = JSON.parse(event.body);

		const imageUrl = buildFileUrl(imageKey);

		const id = KSUID.randomSync().string;
		const Item = {
			[TableKeys.PK]: Entities.COURSE,
			[TableKeys.SK]: buildCourseKey(id),
			[CourseAttributes.ID]: id,
			[CourseAttributes.AUTHOR_ID]: authorId,
			[CourseAttributes.NAME]: name,
			[CourseAttributes.CREATED_AT]: Date.now().toString(),
			[CourseAttributes.IMAGE_URL]: imageUrl,
			[CourseAttributes.LESSONS]: {},
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
