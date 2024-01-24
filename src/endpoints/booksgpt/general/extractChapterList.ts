import { SQS } from 'aws-sdk';
import createThreadAndRunAPI from '../openaiAPI/createThreadAndRunAPI';
import { checkExtractChaptersListRunMessage } from '../processingMessages/checkExtractChaptersListRunMessage';

type TExtractChapterListParams = {
	openAiAssistantId: string;
	assistantId: string;
	uid: string;
};

export default async function extractChapterList({
	openAiAssistantId,
	assistantId,
	uid,
}: TExtractChapterListParams) {
	const sqs = new SQS();
	const chaptersExtractionPrompt = `Give me a complete list of chapters of this book in the following format: 
  {
    "chapters": {put array of strings here}
  }
  Don't add additional words or comments. No markup.`;

	const createThreadAndRunAPIResponse = await createThreadAndRunAPI(
		openAiAssistantId,
		chaptersExtractionPrompt
	);
	console.log({ createThreadAndRunAPIResponse });

	if (createThreadAndRunAPIResponse.data.status === 'queued') {
		const runId = createThreadAndRunAPIResponse.data.id;
		const threadId = createThreadAndRunAPIResponse.data.thread_id;
		await sqs
			.sendMessage(
				checkExtractChaptersListRunMessage({
					runId,
					assistantId,
					threadId,
					uid,
					openAiAssistantId,
				})
			)
			.promise();
	}
}
