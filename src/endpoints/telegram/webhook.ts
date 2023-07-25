import { APIGatewayProxyHandler } from 'aws-lambda';
import { CustomAPIGateway } from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import axios from 'axios';
import { TelegramUser } from '@/endpoints/telegram/dexAnalyzer';

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const SLACK_URL = process.env.SLACK_BOT_CHANNEL_URL;

export interface TelegramPayload {
	update_id: number;
	message: {
		message_id: number;
		from: TelegramUser;
		chat: {
			id: number;
			first_name: string;
			username: string;
			type: string;
		};
		date: number;
		text: string;
	};
}

export const STANDARD_ERROR_MESSAGE = `Please provide a valid message in the format: Contract_Address_Of_Coin Start_Date End_Date. Date format is YYYY-MM-DD. Example of a valid request: 0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F 2023-07-18 2023-07-21`;

const processMessage = async (payload: TelegramPayload) => {
	const { text } = payload.message;
	if (payload.message.text.startsWith('/start')) {
		return 'I will help you find profitable wallets for your research. I can analyze DEX trades for a specific coin in a specific time period. Send me a message in the format: Contract_Address_Of_Coin Start_Date End_Date. Date format is YYYY-MM-DD. Example of a valid request: 0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F 2023-07-18 2023-07-21. Good luck!';
	}
	const [contractAddress, since, till] = text.split(' ');
	if (!contractAddress || !since || !till) {
		return STANDARD_ERROR_MESSAGE;
	}
	try {
		await addToSQSQueue(payload, contractAddress, since, till);
	} catch (error) {
		console.log({ error });
	}

	return 'Processing started. May take up to 1-2 min. Please wait the response...';
};

export const sendTelegramMessage = async (chatId: number, text: string) => {
	const url = `${TELEGRAM_API_BASE_URL}/sendMessage`;
	console.log({ url });
	const data = {
		chat_id: chatId,
		text,
	};
	await axios.post(url, data);
};

const addToSQSQueue = async (
	payload: TelegramPayload,
	contractAddress: string,
	startDate: string,
	endDate: string
) => {
	const sqs = new AWS.SQS();
	const queueUrl = process.env.MAIN_QUEUE_URL;
	console.log({ queueUrl });
	const messageBody = JSON.stringify({
		payload,
		contractAddress,
		startDate,
		endDate,
	});

	const params = {
		MessageBody: messageBody,
		QueueUrl: queueUrl,
	};

	await sqs.sendMessage(params).promise();
};

export const sendMessageToSlackBot = async (text: string) => {
	console.log({ SLACK_URL, text });
	try {
		await axios.post(SLACK_URL, { text });
	} catch (error) {
		console.log({ error });
	}
};

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const body = JSON.parse(event.body) as TelegramPayload;
		console.log(JSON.stringify(body, null, 4));

		const response = await processMessage(body);

		try {
			await sendTelegramMessage(body.message.chat.id, response);
		} catch (error) {
			//
		}

		await sendMessageToSlackBot(
			'Request:' + '```' + body + '```' + 'Response:' + '```' + response + '```'
		);

		return sendResponse(200, {
			message: 'Message processed successfully',
			body: body,
		});
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const webhook = handler;
