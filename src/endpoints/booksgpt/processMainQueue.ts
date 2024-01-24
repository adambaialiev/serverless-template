import { SQSHandler, SQSMessageAttributes } from 'aws-lambda';
import { EProcessingMessageTypes } from './processingMessages/types';
import { AssistantAttributes } from '@/common/dynamo/schema';
import OpenAI from 'openai';
import { S3, SQS } from 'aws-sdk';
import retrieveRunAPI from './openaiAPI/retrieveRunAPI';
import createOpenAiAssistant from './general/сreateOpenAIAssistant';
import createOpenAIFile from './general/createOpenAIFile';
import updateAssistant from './general/updateAssistant';
import extractChapterList from './general/extractChapterList';
import { extractChapterSummaryMessage } from './processingMessages/extractChapterSummaryMessage';
import extractChapterSummary from './general/extractChapterSummary';
import getResponse from './general/getResponse';

export const main: SQSHandler = async (event) => {
	const sqs = new SQS();
	try {
		for (const record of event.Records) {
			const messageAttributes: SQSMessageAttributes = record.messageAttributes;

			console.log('Message Attributtes -->  ', messageAttributes);
			console.log('Message Body -->  ', record.body);
			const messageBody = record.body as EProcessingMessageTypes;

			const s3 = new S3();
			if (messageBody === EProcessingMessageTypes.createAssistant) {
				const name = messageAttributes.name.stringValue;
				const author = messageAttributes.author.stringValue;
				const pdfKey = messageAttributes.pdfKey.stringValue;
				const coverImageKey = messageAttributes.coverImageKey.stringValue;
				const uid = messageAttributes.uid.stringValue;
				const assistantId = messageAttributes.assistantId.stringValue;
				if (
					!name ||
					!author ||
					!pdfKey ||
					!coverImageKey ||
					!uid ||
					!assistantId
				) {
					throw new Error('Missing message attributes');
				}

				await updateAssistant(
					uid,
					assistantId,
					'SET #status = :status',
					{ '#status': AssistantAttributes.STATUS },
					{ ':status': { S: 'Started processing' } }
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
						{ ':status': { S: 'Failed to read pdf' } }
					);
					throw new Error('Failed to read file from s3');
				}

				let file: OpenAI.Files.FileObject;

				try {
					file = await createOpenAIFile(pdfFileBuffer, author);
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{ ':status': { S: 'Failed to create OpenAI file' } }
					);
					throw new Error('Failed to create open ai file');
				}

				let openAiAssistantId: string;

				try {
					openAiAssistantId = await createOpenAiAssistant({
						name,
						author,
						fileId: file.id,
					});
				} catch (error) {
					console.log({ error });
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{ ':status': { S: 'Failed to create OpenAI assistant' } }
					);
					throw new Error('Failed to create open ai assistant');
				}

				await updateAssistant(
					uid,
					assistantId,
					'SET #status = :status',
					{ '#status': AssistantAttributes.STATUS },
					{
						':status': {
							S: 'Assistant is created. Extracting the list of chapters',
						},
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
							':status': {
								S: 'Failed to start extracting chapter list',
							},
						}
					);
					throw new Error('Failed to start extracting chapter list');
				}
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
							'SET #chaptersList = :chaptersList, #chaptersSummaries = :chaptersSummaries',
							{
								'#chaptersList': AssistantAttributes.CHAPTERS_LIST,
								'#chaptersSummaries': AssistantAttributes.CHAPTERS_SUMMARIES,
							},
							{
								':chaptersList': {
									L: chaptersListObject.chapters.map((chapter) => ({
										S: chapter,
									})),
								},
								':chaptersSummaries': {
									L: chaptersListObject.chapters.map(() => ({
										S: '',
									})),
								},
							}
						);
						for (let i = 0; i < chaptersListObject.chapters.length; i++) {
							await sqs
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
					}
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': {
								S: 'Chapters are extracted. The process to summarize each chapter has started',
							},
						}
					);
				}
				if (response.data.status === 'failed') {
					await updateAssistant(
						uid,
						assistantId,
						'SET #status = :status',
						{ '#status': AssistantAttributes.STATUS },
						{
							':status': {
								S: 'Failed to extract chapters list',
							},
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
					}
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
};
