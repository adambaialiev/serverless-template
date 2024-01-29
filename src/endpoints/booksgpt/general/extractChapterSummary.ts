import { SQS } from 'aws-sdk';
import createThreadAndRunAPI from '../openaiAPI/createThreadAndRunAPI';
import { checkExtractChapterSummaryRunMessage } from '../processingMessages/checkExtractChapterSummaryRunMessage';

type TParams = {
	assistantId: string;
	chapter: string;
	index: string;
	apiKey: string;
};

export default async function extractChapterSummary({
	assistantId,
	chapter,
	index,
	apiKey,
}: TParams) {
	const sqs = new SQS();

	const prompt = `Give me the summary of the chapter ${chapter} from the book`;

	const createThreadAndRunAPIResponse = await createThreadAndRunAPI(
		assistantId,
		prompt,
		apiKey
	);
	console.log({ createThreadAndRunAPIResponse });

	if (createThreadAndRunAPIResponse.data.status === 'queued') {
		const runId = createThreadAndRunAPIResponse.data.id;
		const threadId = createThreadAndRunAPIResponse.data.thread_id;
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
}
