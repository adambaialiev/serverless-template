import createThreadAndRunAPI from '../openaiAPI/createThreadAndRunAPI';

type TExtractChapterListParams = {
	openAiAssistantId: string;
	assistantId: string;
	uid: string;
};

export default async function extractChapterList({
	openAiAssistantId,
}: TExtractChapterListParams) {
	const chaptersExtractionPrompt = `Give me a complete list of chapters of this book in the following format: 
  {
    "chapters": {put array of strings here}
  }
  Do not add additional words or comments. Do not use markdown syntax.`;

	const createThreadAndRunAPIResponse = await createThreadAndRunAPI(
		openAiAssistantId,
		chaptersExtractionPrompt
	);
	console.log({ createThreadAndRunAPIResponse });

	if (createThreadAndRunAPIResponse.data.status === 'queued') {
		const runId = createThreadAndRunAPIResponse.data.id;
		const threadId = createThreadAndRunAPIResponse.data.thread_id;
		return { runId, threadId };
	}
	throw new Error('Not queued');
}
