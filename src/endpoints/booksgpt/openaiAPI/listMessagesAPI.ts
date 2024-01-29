import { axiosInstance } from '../axiosInstance';

export default function listMessagersAPI(threadId: string, apiKey: string) {
	return axiosInstance(apiKey).get(`v1/threads/${threadId}/messages`);
}
