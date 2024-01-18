import { axiosInstance } from '../axiosInstance';

export default async function createThreadAndRunAPI(
	assistant_id: string,
	message: string
) {
	return axiosInstance.post('/v1/threads/runs', {
		assistant_id: assistant_id,
		thread: { messages: [{ role: 'user', content: message }] },
	});
}
