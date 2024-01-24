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
	const assistantCreationParams = {
		name: `${name} by ${author}`,
		model: 'gpt-4-1106-preview',
		instructions: `You are an assistant that have read the book called ${name} by ${author}. You should be able to summarize the book, its chapters and respond to any other questions about the book.`,
		tools: [{ type: 'retrieval' }],
	};
	const createAssistantResponse = await axiosInstance.post(`/v1/assistants`, {
		...assistantCreationParams,
		file_ids: [fileId],
	});

	const openAiAssistantId = createAssistantResponse.data.id;
	return {
		openAiAssistantId,
		instructions: assistantCreationParams.instructions,
		model: assistantCreationParams.model,
	};
}
