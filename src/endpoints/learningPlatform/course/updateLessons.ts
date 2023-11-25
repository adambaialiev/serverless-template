import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { CourseAttributes, Entities, TableKeys } from '@/common/dynamo/schema';
import { buildCourseKey } from '@/common/dynamo/buildKey';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.learning_platform_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { courseId, lessons } = JSON.parse(event.body);

		await dynamo
			.update({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.COURSE,
					[TableKeys.SK]: buildCourseKey(courseId),
				},
				UpdateExpression: `SET #lessons = :lessons`,
				ExpressionAttributeNames: {
					'#lessons': CourseAttributes.LESSONS,
				},
				ExpressionAttributeValues: {
					':lessons': lessons,
				},
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
