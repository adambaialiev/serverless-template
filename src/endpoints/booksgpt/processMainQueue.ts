import { SQSHandler, SQSMessageAttributes } from 'aws-lambda';
import { EProcessingMessageTypes } from './processingMessages/types';
import {
	AssistantAttributes,
	AssistantItem,
	Entities,
	TableKeys,
} from '@/common/dynamo/schema';
import AWS, { SQS } from 'aws-sdk';
import retrieveRunAPI from './openaiAPI/retrieveRunAPI';
import updateAssistant from './general/updateAssistant';
import extractChapterList from './general/extractChapterList';
import { extractChapterSummaryMessage } from './processingMessages/extractChapterSummaryMessage';
import extractChapterSummary from './general/extractChapterSummary';
import getResponse from './general/getResponse';
import { buildAssistantKey } from '@/common/dynamo/buildKey';
import { extractGeneralSummaryMessage } from './processingMessages/extractGeneralSummaryMessage';
import extractGeneralSummary from './general/extractGeneralSummary';
import { checkExtractChaptersListRunMessage } from './processingMessages/checkExtractChaptersListRunMessage';
import { checkExtractGeneralSummaryRunMessage } from './processingMessages/checkExtractGeneralSummaryRunMessage';
import { checkExtractChapterSummaryRunMessage } from './processingMessages/checkExtractChapterSummaryRunMessage';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.booksgpt_table as string;

export const main: SQSHandler = async (event) => {
	const sqs = new SQS();
	console.log({ Records: JSON.stringify(event.Records, null, 2) });
	for (const record of event.Records) {
		try {
			const messageAttributes: SQSMessageAttributes = record.messageAttributes;
			console.log({ record });
			console.log('Message Attributtes -->  ', messageAttributes);
			console.log('Message Body -->  ', record.body);
			const messageBody = record.body as EProcessingMessageTypes;

			if (messageBody === EProcessingMessageTypes.extractChaptersList) {
				const assistantId = messageAttributes.assistantId.stringValue;
				const apiKey = messageAttributes.apiKey.stringValue;

				let runId: string;
				let threadId: string;
				try {
					const r = await extractChapterList({
						assistantId,
						apiKey,
					});
					runId = r.runId;
					threadId = r.threadId;
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': 'Failed to start extracting chapter list',
						}
					);
					throw new Error('Failed to start extracting chapter list');
				}
				await updateAssistant(
					assistantId,
					'SET #status = :status',
					{ '#status': AssistantAttributes.STATUS },
					{
						':status': 'The process of chapters list extraction has started',
					}
				);
				await sqs
					.sendMessage(
						checkExtractChaptersListRunMessage({
							runId,
							assistantId,
							threadId,
							apiKey,
						})
					)
					.promise();
			}
			if (messageBody === EProcessingMessageTypes.checkExtractChaptersListRun) {
				const runId = messageAttributes.runId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const threadId = messageAttributes.threadId.stringValue;
				const apiKey = messageAttributes.apiKey.stringValue;

				if (!runId || !assistantId || !threadId || !apiKey) {
					throw new Error('Missing message attributes');
				}
				const retrieveRunResponse = await retrieveRunAPI(
					threadId,
					runId,
					apiKey
				);
				console.log({ retrieveRunResponse });
				if (retrieveRunResponse.data.status === 'completed') {
					const aiResponse = await getResponse(threadId, apiKey);
					if (aiResponse) {
						const cleanResponse = aiResponse
							.replace(/```json/gi, '')
							.replace(/```/gi, '')
							.replace(/\n/gi, '');

						console.log({ cleanResponse });

						let chaptersListObject: { chapters: string[] };

						try {
							chaptersListObject = JSON.parse(cleanResponse) as {
								chapters: string[];
							};
						} catch (error) {
							console.log({ error });
							await updateAssistant(
								assistantId,
								'SET #status = :status',
								{ '#status': AssistantAttributes.STATUS },
								{
									':status': 'Failed to parse chapters list response',
								}
							);
							throw new Error('Failed to parse chapters list response');
						}

						await updateAssistant(
							assistantId,
							'SET #status = :status, #chaptersList = :chaptersList, #chaptersSummaries = :chaptersSummaries',
							{
								'#chaptersList': AssistantAttributes.CHAPTERS_LIST,
								'#chaptersSummaries': AssistantAttributes.CHAPTERS_SUMMARIES,
								'#status': AssistantAttributes.STATUS,
							},
							{
								':status': !chaptersListObject.chapters.length
									? 'Chapter list is empty. Please make sure that the book is not cut.'
									: 'Chapters list is extracted. The process to extract each chapter summary has started',
								':chaptersList': chaptersListObject.chapters,
								':chaptersSummaries': chaptersListObject.chapters.map(() => ''),
							}
						);
						for (let i = 0; i < chaptersListObject.chapters.length; i++) {
							sqs
								.sendMessage(
									extractChapterSummaryMessage({
										assistantId,
										chapter: chaptersListObject.chapters[i],
										index: i.toString(),
										apiKey,
									})
								)
								.promise();
						}
						sqs
							.sendMessage(
								extractGeneralSummaryMessage({
									assistantId,
									apiKey,
								})
							)
							.promise();
					}
				}
				if (retrieveRunResponse.data.status === 'failed') {
					await updateAssistant(
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': 'Failed to extract chapters list',
						}
					);
				}
				if (retrieveRunResponse.data.status === 'in_progress') {
					await sqs
						.sendMessage(
							checkExtractChaptersListRunMessage({
								runId,
								assistantId,
								threadId,
								apiKey,
							})
						)
						.promise();
				}
			}

			if (messageBody === EProcessingMessageTypes.extractChapterSummary) {
				const assistantId = messageAttributes.assistantId.stringValue;
				const chapter = messageAttributes.chapter.stringValue;
				const index = messageAttributes.index.stringValue;
				const apiKey = messageAttributes.apiKey.stringValue;
				try {
					await extractChapterSummary({
						assistantId,
						chapter,
						index,
						apiKey,
					});
				} catch (error) {
					console.log({ error });
				}
			}
			if (messageBody === EProcessingMessageTypes.extractGeneralSummary) {
				const assistantId = messageAttributes.assistantId.stringValue;
				const apiKey = messageAttributes.apiKey.stringValue;
				try {
					await extractGeneralSummary({
						assistantId,
						apiKey,
					});
				} catch (error) {
					console.log({ error });
				}
			}

			if (
				messageBody === EProcessingMessageTypes.checkExtractGeneralSummaryRun
			) {
				const runId = messageAttributes.runId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const threadId = messageAttributes.threadId.stringValue;
				const apiKey = messageAttributes.apiKey.stringValue;
				const retrieveRunResponse = await retrieveRunAPI(
					threadId,
					runId,
					apiKey
				);
				console.log({ retrieveRunResponse });
				if (retrieveRunResponse.data.status === 'completed') {
					const aiResponse = await getResponse(threadId, apiKey);
					if (aiResponse) {
						await updateAssistant(
							assistantId,
							`SET #generalSummary = :generalSummary`,
							{
								'#generalSummary': AssistantAttributes.GENERAL_SUMMARY,
							},
							{
								':generalSummary': aiResponse,
							}
						);
					}
				}
				if (retrieveRunResponse.data.status === 'failed') {
					await updateAssistant(
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': 'Failed to extract general summary',
						}
					);
				}
				if (retrieveRunResponse.data.status === 'in_progress') {
					await sqs
						.sendMessage(
							checkExtractGeneralSummaryRunMessage({
								runId,
								assistantId,
								threadId,
								apiKey,
							})
						)
						.promise();
				}
			}

			if (
				messageBody === EProcessingMessageTypes.checkExtractChapterSummaryRun
			) {
				const runId = messageAttributes.runId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const threadId = messageAttributes.threadId.stringValue;
				const index = messageAttributes.index.stringValue;
				const apiKey = messageAttributes.apiKey.stringValue;
				if (!runId || !assistantId || !threadId || !apiKey) {
					throw new Error('Missing message attributes');
				}
				const retrieveRunResponse = await retrieveRunAPI(
					threadId,
					runId,
					apiKey
				);
				console.log({ retrieveRunResponse });
				if (retrieveRunResponse.data.status === 'completed') {
					const aiResponse = await getResponse(threadId, apiKey);
					if (aiResponse) {
						await updateAssistant(
							assistantId,
							`SET #chaptersSummaries[${index}] = :chaptersSummaries`,
							{
								'#chaptersSummaries': AssistantAttributes.CHAPTERS_SUMMARIES,
							},
							{
								':chaptersSummaries': aiResponse,
							}
						);
						const assistantItem = await dynamo
							.get({
								TableName,
								Key: {
									[TableKeys.PK]: Entities.ASSISTANT,
									[TableKeys.SK]: buildAssistantKey(assistantId),
								},
							})
							.promise();

						if (assistantItem.Item) {
							const item = assistantItem.Item as AssistantItem;
							const chaptersSummaries = item.chaptersSummaries;
							console.log({ chaptersSummaries });
							if (chaptersSummaries.every((chapter) => chapter !== '')) {
								await updateAssistant(
									assistantId,
									'SET #status = :status',
									{ '#status': AssistantAttributes.STATUS },
									{
										':status': 'All chapters summaries are extracted',
									}
								);
							}
						}
					}
				}
				if (retrieveRunResponse.data.status === 'in_progress') {
					await sqs
						.sendMessage(
							checkExtractChapterSummaryRunMessage({
								runId,
								assistantId,
								threadId,
								index,
								apiKey,
							})
						)
						.promise();
				}
				if (retrieveRunResponse.data.status === 'failed') {
					await updateAssistant(
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': `Failed to extract chapter summary for chapter with index ${index}`,
						}
					);
				}
			}
		} catch (error) {
			console.log({ error });
		}
		await sqs
			.deleteMessage({
				QueueUrl: process.env.MAIN_QUEUE_URL,
				ReceiptHandle: record.receiptHandle,
			})
			.promise();
	}
};
