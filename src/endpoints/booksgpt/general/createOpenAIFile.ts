import OpenAI, { toFile } from 'openai';
import { OPEN_AI_API_TOKEN } from '../axiosInstance';

export default async function createOpenAIFile(
	pdfFileBuffer: Buffer,
	author: string
) {
	const openai = new OpenAI({ apiKey: OPEN_AI_API_TOKEN });
	const pdfFile = await toFile(pdfFileBuffer, `${name} by ${author}.pdf`);

	const file = await openai.files.create({
		file: pdfFile,
		purpose: 'assistants',
	});
	return file;
}
