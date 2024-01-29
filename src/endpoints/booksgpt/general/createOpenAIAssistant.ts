import { axiosInstance } from '../axiosInstance';

type TCreateOpenAiAssistantParams = {
	name: string;
	author: string;
	fileId: string;
};

export default async function createOpenAiAssistant({
	name,
	author,
	fileId,
}: TCreateOpenAiAssistantParams) {
	const instructions = `You are an assistant that have read the book called ${name} by ${author}. You should be able to summarize the book, its chapters and respond to any other questions about the book. Respond to questions in language that the book was written.`;
	const assistantCreationParams = {
		name: `${name} by ${author}`,
		model: 'gpt-4-turbo-preview',
		instructions,
		tools: [{ type: 'retrieval' }],
	};
	const createAssistantResponse = await axiosInstance('').post(
		`/v1/assistants`,
		{
			...assistantCreationParams,
			file_ids: [fileId],
		}
	);

	const openAiAssistantId = createAssistantResponse.data.id;
	return {
		openAiAssistantId,
		instructions: assistantCreationParams.instructions,
		model: assistantCreationParams.model,
	};
}
