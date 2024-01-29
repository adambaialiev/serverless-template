import listMessagersAPI from '../openaiAPI/listMessagesAPI';

export default async function getResponse(threadId: string, apiKey: string) {
	const listMessagesResponse = await listMessagersAPI(threadId, apiKey);
	if (listMessagesResponse.data.data) {
		const messages = listMessagesResponse.data.data;
		console.log({ messages });
		if (messages.length) {
			const lastMessage = messages[0];
			console.log({ lastMessage });
			const response = lastMessage.content[0].text.value as string;
			console.log({ response });
			return response;
		}
	}
	return undefined;
}
