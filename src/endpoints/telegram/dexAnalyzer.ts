import { sendTelegramMessage } from '@/endpoints/telegram/webhook';
import { SQSEvent } from 'aws-lambda';

const handler = async (event: SQSEvent) => {
	try {
		for (const record of event.Records) {
			const { chatId, contractAddress, startDate, endDate } = JSON.parse(
				record.body
			);
			console.log({ chatId, contractAddress, startDate, endDate });
			await sendTelegramMessage(chatId, 'Here are the results: bla bla bla');
		}

		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Messages processed successfully' }),
		};
	} catch (error) {
		console.error('Error processing messages:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Error processing messages' }),
		};
	}
};

export const dexAnalyzer = handler;
