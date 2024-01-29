import axios from 'axios';

export const axiosInstance = (apiKey: string) =>
	axios.create({
		baseURL: 'https://api.openai.com/',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'OpenAI-Beta': 'assistants=v1',
		},
	});
