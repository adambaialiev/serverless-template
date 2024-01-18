import { axiosInstance } from '../axiosInstance';

export default function listMessagersAPI(threadId: string) {
	return axiosInstance.get(`v1/threads/${threadId}/messages`);
}
