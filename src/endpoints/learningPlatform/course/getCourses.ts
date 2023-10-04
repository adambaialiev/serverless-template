import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { Entities, TableKeys } from '@/common/dynamo/schema';
import { Lesson } from '../types';
import { buildFileUrl } from '../utils';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.learning_platform_table as string;

export const main: APIGatewayProxyHandler = async () => {
	try {
		const queryOutput = await dynamo
			.query({
				TableName,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.COURSE,
				},
				ScanIndexForward: false,
			})
			.promise();

		const items = queryOutput.Items.map((item) => ({
			...item,
			lessons: {
				...item.lessons,
				lessons: item.lessons.map((lesson: Lesson) => ({
					...lesson,
					videoUrl: buildFileUrl(lesson.videoUrl),
					imageUrl: buildFileUrl(lesson.imageUrl),
				})),
			},
		}));

		return sendResponse(201, items);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
