import createThreadAndRunAPI from '../openaiAPI/createThreadAndRunAPI';

type TExtractChapterListParams = {
	assistantId: string;
	apiKey: string;
};

export default async function extractChapterList({
	assistantId,
	apiKey,
}: TExtractChapterListParams) {
	const chaptersExtractionPrompt = `Give me a complete list of chapters of this book in the following format: 
  {
    "chapters": {put array of strings here}
  }
  Do not add additional words or comments. Do not use markdown syntax.`;

	const createThreadAndRunAPIResponse = await createThreadAndRunAPI(
		assistantId,
		chaptersExtractionPrompt,
		apiKey
	);
	console.log({ createThreadAndRunAPIResponse });

	if (createThreadAndRunAPIResponse.data.status === 'queued') {
		const runId = createThreadAndRunAPIResponse.data.id;
		const threadId = createThreadAndRunAPIResponse.data.thread_id;
		return { runId, threadId };
	}
	throw new Error('Not queued');
}
