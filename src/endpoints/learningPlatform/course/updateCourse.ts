import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { Entities, TableKeys, CourseAttributes } from '@/common/dynamo/schema';
import { buildCourseKey } from '@/common/dynamo/buildKey';
import { buildFileUrlForCourseProject } from '../utils';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.learning_platform_table as string;

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { name, imageKey, courseId } = JSON.parse(event.body);

		const imageUrl = buildFileUrlForCourseProject(imageKey);

		await dynamo
			.update({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.COURSE,
					[TableKeys.SK]: buildCourseKey(courseId),
				},
				UpdateExpression: `SET #name = :name, #imageUrl = :imageUrl`,
				ExpressionAttributeNames: {
					'#name': CourseAttributes.NAME,
					'#imageUrl': CourseAttributes.IMAGE_URL,
				},
				ExpressionAttributeValues: {
					':name': name,
					':imageUrl': imageUrl,
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
