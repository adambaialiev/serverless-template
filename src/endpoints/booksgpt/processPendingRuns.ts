import {
	AssistantAttributes,
	Entities,
	JobType,
	PendingRunItem,
	TableKeys,
} from '@/common/dynamo/schema';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import retrieveRunAPI from './openaiAPI/retrieveRunAPI';
import listMessagersAPI from './openaiAPI/listMessagesAPI';
import { buildAssistantKey } from '@/common/dynamo/buildKey';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: APIGatewayProxyHandler = async () => {
	try {
		const pendingRunsOutput = await dynamo
			.query({
				TableName,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.PENDING_RUN,
				},
				ScanIndexForward: false,
			})
			.promise();

		if (pendingRunsOutput.Items?.length) {
			for (const pendingRun of pendingRunsOutput.Items) {
				const { jobType, threadId, id, assistantId } =
					pendingRun as PendingRunItem;
				if (jobType === JobType.CHAPTERS_LIST_EXTRACTION) {
					const response = await retrieveRunAPI(threadId, id);
					if (response.data.status === 'completed') {
						const listMessagesResponse = await listMessagersAPI(threadId);
						if (listMessagesResponse.data) {
							const messages = listMessagesResponse.data;
							if (messages.length) {
								const lastMessage = messages[messages.length - 1];
								const response = lastMessage.content[0].text.value;

								await dynamo
									.update({
										TableName,
										Key: {
											[TableKeys.PK]: Entities.ASSISTANT,
											[TableKeys.SK]: buildAssistantKey(assistantId),
										},
										UpdateExpression: `SET #chaptersList = :chaptersList`,
										ExpressionAttributeNames: {
											'#name': AssistantAttributes.CHAPTERS_LIST,
										},
										ExpressionAttributeValues: {
											':chaptersList': response,
										},
									})
									.promise();
							}
						}
					}
				}
				if (jobType === JobType.GENERAL_SUMMARY_EXTRACTION) {
					//
				}
				if (jobType === JobType.CHAPTER_SUMMARY_EXTRACTION) {
					//
				}
			}
		}
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
