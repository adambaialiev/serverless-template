import { axiosInstance } from '../axiosInstance';

export default function retrieveRunAPI(
	threadId: string,
	runId: string,
	apiKey: string
) {
	return axiosInstance(apiKey).get(`/v1/threads/${threadId}/runs/${runId}`);
}