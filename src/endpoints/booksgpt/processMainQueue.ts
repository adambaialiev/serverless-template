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

				let runId: string;
				let threadId: string;
				try {
					const r = await extractChapterList({
						assistantId,
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
						})
					)
					.promise();
			}
			if (messageBody === EProcessingMessageTypes.checkExtractChaptersListRun) {
				const runId = messageAttributes.runId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const threadId = messageAttributes.threadId.stringValue;

				if (!runId || !assistantId || !threadId) {
					throw new Error('Missing message attributes');
				}
				const response = await retrieveRunAPI(threadId, runId);
				console.log({ retrieveRunResponse: response });
				if (response.data.status === 'completed') {
					const response = await getResponse(threadId);
					if (response) {
						const cleanResponse = response
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
								':status':
									'Chapters list is extracted. The process to extract each chapter summary has started',
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
									})
								)
								.promise();
						}
						sqs
							.sendMessage(
								extractGeneralSummaryMessage({
									assistantId,
								})
							)
							.promise();
					}
				}
				if (response.data.status === 'failed') {
					await updateAssistant(
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': 'Failed to extract chapters list',
						}
					);
				}
				if (response.data.status === 'in_progress') {
					await sqs
						.sendMessage(
							checkExtractChaptersListRunMessage({
								runId,
								assistantId,
								threadId,
							})
						)
						.promise();
				}
			}

			if (messageBody === EProcessingMessageTypes.extractChapterSummary) {
				const assistantId = messageAttributes.assistantId.stringValue;
				const chapter = messageAttributes.chapter.stringValue;
				const index = messageAttributes.index.stringValue;
				try {
					await extractChapterSummary({
						assistantId,
						chapter,
						index,
					});
				} catch (error) {
					console.log({ error });
				}
			}
			if (messageBody === EProcessingMessageTypes.extractGeneralSummary) {
				const assistantId = messageAttributes.assistantId.stringValue;
				try {
					await extractGeneralSummary({
						assistantId,
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
				const response = await retrieveRunAPI(threadId, runId);
				console.log({ retrieveRunResponse: response });
				if (response.data.status === 'completed') {
					const response = await getResponse(threadId);
					if (response) {
						await updateAssistant(
							assistantId,
							`SET #generalSummary = :generalSummary`,
							{
								'#generalSummary': AssistantAttributes.GENERAL_SUMMARY,
							},
							{
								':generalSummary': response,
							}
						);
					}
				}
				if (response.data.status === 'failed') {
					await updateAssistant(
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': 'Failed to extract general summary',
						}
					);
				}
				if (response.data.status === 'in_progress') {
					await sqs
						.sendMessage(
							checkExtractGeneralSummaryRunMessage({
								runId,
								assistantId,
								threadId,
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
				if (!runId || !assistantId || !threadId) {
					throw new Error('Missing message attributes');
				}
				const response = await retrieveRunAPI(threadId, runId);
				console.log({ retrieveRunResponse: response });
				if (response.data.status === 'completed') {
					const response = await getResponse(threadId);
					if (response) {
						await updateAssistant(
							assistantId,
							`SET #chaptersSummaries[${index}] = :chaptersSummaries`,
							{
								'#chaptersSummaries': AssistantAttributes.CHAPTERS_SUMMARIES,
							},
							{
								':chaptersSummaries': response,
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
							if (chaptersSummaries.every((chapter) => chapter.S !== '')) {
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
				if (response.data.status === 'in_progress') {
					await sqs
						.sendMessage(
							checkExtractChapterSummaryRunMessage({
								runId,
								assistantId,
								threadId,
								index,
							})
						)
						.promise();
				}
				if (response.data.status === 'failed') {
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
