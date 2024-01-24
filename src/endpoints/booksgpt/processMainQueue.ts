import { SQSHandler, SQSMessageAttributes } from 'aws-lambda';
import { EProcessingMessageTypes } from './processingMessages/types';
import {
	AssistantAttributes,
	AssistantItem,
	TableKeys,
} from '@/common/dynamo/schema';
import OpenAI from 'openai';
import AWS, { S3, SQS } from 'aws-sdk';
import retrieveRunAPI from './openaiAPI/retrieveRunAPI';
import createOpenAiAssistant from './general/сreateOpenAIAssistant';
import createOpenAIFile from './general/createOpenAIFile';
import updateAssistant from './general/updateAssistant';
import extractChapterList from './general/extractChapterList';
import { extractChapterSummaryMessage } from './processingMessages/extractChapterSummaryMessage';
import extractChapterSummary from './general/extractChapterSummary';
import getResponse from './general/getResponse';
import { buildAssistantKey, buildUserKey } from '@/common/dynamo/buildKey';
import { extractGeneralSummaryMessage } from './processingMessages/extractGeneralSummaryMessage';
import extractGeneralSummary from './general/extractGeneralSummary';
import { createAssistantMessage } from './processingMessages/createAssistantMessage';

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

			const s3 = new S3();
			if (messageBody === EProcessingMessageTypes.uploadPdf) {
				const uid = messageAttributes.uid.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const name = messageAttributes.name.stringValue;
				const pdfKey = messageAttributes.pdfKey.stringValue;
				const author = messageAttributes.author.stringValue;
				await updateAssistant(
					uid,
					assistantId,
					'SET #status = :status',
					{ '#status': AssistantAttributes.STATUS },
					{ ':status': 'Started uploading pdf for the model' }
				);
				let pdfFileBuffer: Buffer;

				try {
					pdfFileBuffer = await new Promise((resolve) => {
						s3.getObject(
							{
								Bucket: process.env.booksgpt_bucket as string,
								Key: pdfKey,
							},
							(err, data) => {
								if (err) {
									//
								}
								resolve(data.Body as Buffer);
							}
						);
					});
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{ ':status': 'Failed to read pdf' }
					);
					throw new Error('Failed to read file from s3');
				}

				let file: OpenAI.Files.FileObject;

				try {
					file = await createOpenAIFile({ pdfFileBuffer, author, name });
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{ ':status': 'Failed to create OpenAI file' }
					);
					throw new Error('Failed to create open ai file');
				}
				await sqs
					.sendMessage(
						createAssistantMessage({
							name,
							author,
							assistantId,
							uid,
							fileId: file.id,
						})
					)
					.promise();
			}
			if (messageBody === EProcessingMessageTypes.createAssistant) {
				const name = messageAttributes.name.stringValue;
				const author = messageAttributes.author.stringValue;
				const uid = messageAttributes.uid.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const fileId = messageAttributes.fileId.stringValue;
				if (!name || !author || !uid || !assistantId || !fileId) {
					throw new Error('Missing message attributes');
				}

				await updateAssistant(
					uid,
					assistantId,
					'SET #status = :status',
					{ '#status': AssistantAttributes.STATUS },
					{ ':status': 'Started creating assistant' }
				);

				let openAiAssistantId: string;
				let model: string;
				let instructions: string;
				try {
					const result = await createOpenAiAssistant({
						name,
						author,
						fileId: fileId,
					});
					openAiAssistantId = result.openAiAssistantId;
					model = result.model;
					instructions = result.instructions;
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status, #model = :model, #instructions = :instructions',
						{
							'#status': AssistantAttributes.STATUS,
						},
						{ ':status': 'Failed to create OpenAI assistant' }
					);
					throw new Error('Failed to create open ai assistant');
				}

				await updateAssistant(
					uid,
					assistantId,
					'SET #status = :status, #model = :model, #instructions = :instructions, #openAiAssistantId = :openAiAssistantId',
					{
						'#status': AssistantAttributes.STATUS,
						'#model': AssistantAttributes.MODEL,
						'#instructions': AssistantAttributes.INSTRUCTIONS,
						'#openAiAssistantId': AssistantAttributes.OPEN_AI_ASSISTANT_ID,
					},
					{
						':status':
							'Assistant is created. Going to start extracting the list of chapters',
						':model': model,
						':instructions': instructions,
						':openAiAssistantId': openAiAssistantId,
					}
				);

				try {
					await extractChapterList({ openAiAssistantId, assistantId, uid });
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						uid,
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
					uid,
					assistantId,
					'SET #status = :status',
					{ '#status': AssistantAttributes.STATUS },
					{
						':status': 'The process of chapters list extraction has started',
					}
				);
			}
			if (messageBody === EProcessingMessageTypes.checkExtractChaptersListRun) {
				const runId = messageAttributes.runId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const threadId = messageAttributes.threadId.stringValue;
				const uid = messageAttributes.uid.stringValue;
				const openAiAssistantId =
					messageAttributes.openAiAssistantId.stringValue;
				if (!runId || !assistantId || !threadId || !uid || !openAiAssistantId) {
					throw new Error('Missing message attributes');
				}
				const response = await retrieveRunAPI(threadId, runId);
				console.log({ retrieveRunResponse: response });
				if (response.data.status === 'completed') {
					const response = await getResponse(threadId);
					if (response) {
						const chaptersListObject = JSON.parse(response) as {
							chapters: string[];
						};
						await updateAssistant(
							uid,
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
								':chaptersList': {
									L: chaptersListObject.chapters,
								},
								':chaptersSummaries': {
									L: chaptersListObject.chapters.map(() => ''),
								},
							}
						);
						for (let i = 0; i < chaptersListObject.chapters.length; i++) {
							sqs
								.sendMessage(
									extractChapterSummaryMessage({
										openAiAssistantId,
										assistantId,
										chapter: chaptersListObject.chapters[i],
										index: i.toString(),
										uid,
									})
								)
								.promise();
						}
						sqs
							.sendMessage(
								extractGeneralSummaryMessage({
									openAiAssistantId,
									assistantId,
									uid,
								})
							)
							.promise();
					}
				}
				if (response.data.status === 'failed') {
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': 'Failed to extract chapters list',
						}
					);
				}
			}

			if (messageBody === EProcessingMessageTypes.extractChapterSummary) {
				const openAiAssistantId =
					messageAttributes.openAiAssistantId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const chapter = messageAttributes.chapter.stringValue;
				const index = messageAttributes.index.stringValue;
				const uid = messageAttributes.uid.stringValue;
				try {
					await extractChapterSummary({
						openAiAssistantId,
						assistantId,
						chapter,
						index,
						uid,
					});
				} catch (error) {
					console.log({ error });
				}
			}
			if (messageBody === EProcessingMessageTypes.extractGeneralSummary) {
				const openAiAssistantId =
					messageAttributes.openAiAssistantId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const uid = messageAttributes.uid.stringValue;
				try {
					await extractGeneralSummary({
						openAiAssistantId,
						assistantId,
						uid,
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
				const uid = messageAttributes.uid.stringValue;
				const response = await retrieveRunAPI(threadId, runId);
				console.log({ retrieveRunResponse: response });
				if (response.data.status === 'completed') {
					const response = await getResponse(threadId);
					if (response) {
						await updateAssistant(
							uid,
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
			}

			if (
				messageBody === EProcessingMessageTypes.checkExtractChapterSummaryRun
			) {
				const runId = messageAttributes.runId.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				const threadId = messageAttributes.threadId.stringValue;
				const index = messageAttributes.index.stringValue;
				const uid = messageAttributes.uid.stringValue;
				if (!runId || !assistantId || !threadId) {
					throw new Error('Missing message attributes');
				}
				const response = await retrieveRunAPI(threadId, runId);
				console.log({ retrieveRunResponse: response });
				if (response.data.status === 'completed') {
					const response = await getResponse(threadId);
					if (response) {
						await updateAssistant(
							uid,
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
									[TableKeys.PK]: buildUserKey(uid),
									[TableKeys.SK]: buildAssistantKey(assistantId),
								},
							})
							.promise();

						if (assistantItem.Item) {
							const item = assistantItem.Item as AssistantItem;
							const chaptersSummaries = item.chaptersSummaries;
							if (chaptersSummaries.every((chapter) => chapter.S !== '')) {
								await updateAssistant(
									uid,
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
				if (response.data.status === 'failed') {
					await updateAssistant(
						uid,
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
