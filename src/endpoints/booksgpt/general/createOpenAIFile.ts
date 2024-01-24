import OpenAI, { toFile } from 'openai';
import { OPEN_AI_API_TOKEN } from '../axiosInstance';

type TParams = {
	pdfFileBuffer: Buffer;
	author: string;
	name: string;
};

export default async function createOpenAIFile({
	pdfFileBuffer,
	author,
	name,
}: TParams) {
	const openai = new OpenAI({ apiKey: OPEN_AI_API_TOKEN });
	const pdfFile = await toFile(pdfFileBuffer, `${name} by ${author}.pdf`);

	const file = await openai.files.create({
		file: pdfFile,
		purpose: 'assistants',
	});
	return file;
}
