import OpenAI, { toFile } from 'openai';

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
	const openai = new OpenAI({ apiKey: '' });
	const pdfFile = await toFile(pdfFileBuffer, `${name} by ${author}.pdf`);

	const file = await openai.files.create({
		file: pdfFile,
		purpose: 'assistants',
	});
	return file;
}
