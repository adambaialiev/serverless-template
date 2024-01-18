import { axiosInstance } from '../axiosInstance';

export default function retrieveRunAPI(threadId: string, runId: string) {
	return axiosInstance.get(`/v1/threads/${threadId}/runs/${runId}`);
}
