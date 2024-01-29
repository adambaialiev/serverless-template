import { SQS } from 'aws-sdk';
import createThreadAndRunAPI from '../openaiAPI/createThreadAndRunAPI';
import { checkExtractGeneralSummaryRunMessage } from '../processingMessages/checkExtractGeneralSummaryRunMessage';

type TParams = {
	assistantId: string;
	apiKey: string;
};

export default async function extractGeneralSummary({
	assistantId,
	apiKey,
}: TParams) {
	const sqs = new SQS();

	const prompt = `Please give me general summary of the book`;

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