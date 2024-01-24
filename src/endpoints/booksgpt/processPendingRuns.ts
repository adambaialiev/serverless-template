import {
	AssistantAttributes,
	AssistantItem,
	Entities,
	JobType,
	PendingRunAttributes,
	PendingRunItem,
	TableKeys,
} from '@/common/dynamo/schema';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import retrieveRunAPI from './openaiAPI/retrieveRunAPI';
import listMessagersAPI from './openaiAPI/listMessagesAPI';
import {
	buildAssistantKey,
	buildPendingRunKey,
	buildUserKey,
} from '@/common/dynamo/buildKey';
import createThreadAndRunAPI from './openaiAPI/createThreadAndRunAPI';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

const getChapterExtractionPrompt = (chapter: string) => {
	return `Give me the summary of the chapter ${chapter} from the book`;
};

const extractGeneralSummaryPrompt = 'Give me the summary of the whole book';

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
				console.log({ pendingRun });
				const { jobType, threadId, id, assistantId, userId, chapterName } =
					pendingRun as PendingRunItem;
				if (jobType === JobType.CHAPTERS_LIST_EXTRACTION) {
					const response = await retrieveRunAPI(threadId, id);
					console.log({ retrieveRunResponse: response });
					if (response.data.status === 'completed') {
						const listMessagesResponse = await listMessagersAPI(threadId);
						if (listMessagesResponse.data.data) {
							const messages = listMessagesResponse.data.data;
							console.log({ messages });
							if (messages.length) {
								const lastMessage = messages[0];
								console.log({ lastMessage });
								const response = lastMessage.content[0].text.value;
								console.log({ response });
								const chaptersListObject = JSON.parse(response) as {
									chapters: string[];
								};
								const chaptersSummaries = JSON.stringify({
									summaries: chaptersListObject.chapters.map(() => ''),
								});
								await dynamo
									.update({
										TableName,
										Key: {
											[TableKeys.PK]: buildUserKey(userId),
											[TableKeys.SK]: buildAssistantKey(assistantId),
										},
										UpdateExpression: `SET #chaptersList = :chaptersList, #chaptersSummaries = :chaptersSummaries`,
										ExpressionAttributeNames: {
											'#chaptersList': AssistantAttributes.CHAPTERS_LIST,
											'#chaptersSummaries':
												AssistantAttributes.CHAPTERS_SUMMARIES,
										},
										ExpressionAttributeValues: {
											':chaptersList': response,
											':chaptersSummaries': chaptersSummaries,
										},
									})
									.promise();
								await dynamo
									.delete({
										TableName,
										Key: {
											[TableKeys.PK]: Entities.PENDING_RUN,
											[TableKeys.SK]: buildPendingRunKey(id),
										},
									})
									.promise();

								const chaptersList = chaptersListObject.chapters;
								for (const chapter of chaptersList) {
									const createThreadAndRunAPIResponse =
										await createThreadAndRunAPI(
											assistantId,
											getChapterExtractionPrompt(chapter)
										);
									console.log({ createThreadAndRunAPIResponse });
									if (createThreadAndRunAPIResponse.data.status === 'queued') {
										const runId = createThreadAndRunAPIResponse.data.id;
										try {
											await dynamo
												.put({
													TableName,
													Item: {
														[TableKeys.PK]: Entities.PENDING_RUN,
														[TableKeys.SK]: buildPendingRunKey(runId),
														[PendingRunAttributes.ID]: runId,
														[PendingRunAttributes.ASSISTANT_ID]: assistantId,
														[PendingRunAttributes.USER_ID]: userId,
														[PendingRunAttributes.CREATED_AT]:
															Date.now().toString(),
														[PendingRunAttributes.THREAD_ID]:
															createThreadAndRunAPIResponse.data.thread_id,
														[PendingRunAttributes.JOB_TYPE]:
															JobType.CHAPTERS_SUMMARY_EXTRACTION,
														[PendingRunAttributes.CHAPTER_NAME]: chapter,
													},
												})
												.promise();
										} catch (error) {
											console.log({ error });
										}
									}
								}
								const createThreadAndRunAPIResponse =
									await createThreadAndRunAPI(
										assistantId,
										extractGeneralSummaryPrompt
									);
								console.log({ createThreadAndRunAPIResponse });
								if (createThreadAndRunAPIResponse.data.status === 'queued') {
									const runId = createThreadAndRunAPIResponse.data.id;
									try {
										await dynamo
											.put({
												TableName,
												Item: {
													[TableKeys.PK]: Entities.PENDING_RUN,
													[TableKeys.SK]: buildPendingRunKey(runId),
													[PendingRunAttributes.ID]: runId,
													[PendingRunAttributes.ASSISTANT_ID]: assistantId,
													[PendingRunAttributes.USER_ID]: userId,
													[PendingRunAttributes.CREATED_AT]:
														Date.now().toString(),
													[PendingRunAttributes.THREAD_ID]:
														createThreadAndRunAPIResponse.data.thread_id,
													[PendingRunAttributes.JOB_TYPE]:
														JobType.GENERAL_SUMMARY_EXTRACTION,
												},
											})
											.promise();
									} catch (error) {
										console.log({ error });
									}
								}
							}
						}
					}
				}
				if (jobType === JobType.GENERAL_SUMMARY_EXTRACTION) {
					const response = await retrieveRunAPI(threadId, id);
					console.log({ retrieveRunResponse: response });
					if (response.data.status === 'completed') {
						const listMessagesResponse = await listMessagersAPI(threadId);
						if (listMessagesResponse.data.data) {
							const messages = listMessagesResponse.data.data;
							if (messages.length) {
								const lastMessage = messages[0];
								console.log({ lastMessage });
								const response = lastMessage.content[0].text.value;
								console.log({ response });
								await dynamo
									.update({
										TableName,
										Key: {
											[TableKeys.PK]: buildUserKey(userId),
											[TableKeys.SK]: buildAssistantKey(assistantId),
										},
										UpdateExpression: `SET #generalSummary = :generalSummary`,
										ExpressionAttributeNames: {
											'#generalSummary': AssistantAttributes.GENERAL_SUMMARY,
										},
										ExpressionAttributeValues: {
											':generalSummary': response,
										},
									})
									.promise();
								await dynamo
									.delete({
										TableName,
										Key: {
											[TableKeys.PK]: Entities.PENDING_RUN,
											[TableKeys.SK]: buildPendingRunKey(id),
										},
									})
									.promise();
							}
						}
					}
				}
				if (jobType === JobType.CHAPTERS_SUMMARY_EXTRACTION) {
					const response = await retrieveRunAPI(threadId, id);
					console.log({ retrieveRunResponse: response });
					if (response.data.status === 'completed') {
						const listMessagesResponse = await listMessagersAPI(threadId);
						if (listMessagesResponse.data.data) {
							const messages = listMessagesResponse.data.data;
							console.log({ messages });
							if (messages.length) {
								const lastMessage = messages[0];
								console.log({ lastMessage });
								const response = lastMessage.content[0].text.value;
								console.log({ response });
								const output = await dynamo
									.get({
										TableName,
										Key: {
											[TableKeys.PK]: buildUserKey(userId),
											[TableKeys.SK]: buildAssistantKey(assistantId),
										},
									})
									.promise();
								if (output.Item) {
									const item = output.Item as AssistantItem;
									const chaptersObjectRaw =
										item[AssistantAttributes.CHAPTERS_LIST];
									const chaptersObject = JSON.parse(chaptersObjectRaw) as {
										chapters: string[];
									};
									const index = chaptersObject.chapters.findIndex(
										(ch) => ch === chapterName
									);
									console.log({ chapterName, index });
									const chaptersSummariesRaw =
										item[AssistantAttributes.CHAPTERS_SUMMARIES];
									const chaptersSummariesObject = JSON.parse(
										chaptersSummariesRaw
									) as { summaries: string[] };
									chaptersSummariesObject.summaries[index] = response;
									await dynamo
										.update({
											TableName,
											Key: {
												[TableKeys.PK]: buildUserKey(userId),
												[TableKeys.SK]: buildAssistantKey(assistantId),
											},
											UpdateExpression: `SET #chaptersSummaries = :chaptersSummaries`,
											ExpressionAttributeNames: {
												'#chaptersSummaries':
													AssistantAttributes.CHAPTERS_SUMMARIES,
											},
											ExpressionAttributeValues: {
												':chaptersSummaries': JSON.stringify(
													chaptersSummariesObject
												),
											},
										})
										.promise();
									await dynamo
										.delete({
											TableName,
											Key: {
												[TableKeys.PK]: Entities.PENDING_RUN,
												[TableKeys.SK]: buildPendingRunKey(id),
											},
										})
										.promise();
								}
							}
						}
					}
				}
			}
		}
		return sendResponse(201, { pendingRunsOutput });
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
