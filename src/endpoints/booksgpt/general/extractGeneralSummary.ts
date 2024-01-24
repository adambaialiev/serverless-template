import { SQS } from 'aws-sdk';
import createThreadAndRunAPI from '../openaiAPI/createThreadAndRunAPI';
import { checkExtractGeneralSummaryRunMessage } from '../processingMessages/checkExtractGeneralSummaryRunMessage';

type TParams = {
	openAiAssistantId: string;
	assistantId: string;
	uid: string;
};

export default async function extractGeneralSummary({
	openAiAssistantId,
	assistantId,
	uid,
}: TParams) {
	const sqs = new SQS();

	const prompt = `Please give me general summary of the book`;

	const createThreadAndRunAPIResponse = await createThreadAndRunAPI(
		openAiAssistantId,
		prompt
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
					uid,
				})
			)
			.promise();
	}
}
