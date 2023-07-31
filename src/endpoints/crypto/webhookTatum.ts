import { APIGatewayProxyHandler } from 'aws-lambda';
import axios from 'axios';

interface WebHookTatumResponse {
	address: string;
	timestamp: string;
	amount: string;
	asset: string;
	blockNumber: number;
	counterAddress?: string;
	txId: string;
}

const SLACK_URL = process.env.SLACK_WALLET_WATCHER_URL;

const sendMessageToSlackBot = async (text: string) => {
	console.log({ SLACK_URL, text });
	try {
		await axios.post(SLACK_URL, { text });
	} catch (error) {
		console.log({ error });
	}
};

const handler: APIGatewayProxyHandler = async (event, context, callback) => {
	try {
		const tatumResponse = JSON.parse(
			event.body as string
		) as WebHookTatumResponse;
		console.log({ tatumResponse });

		await sendMessageToSlackBot(
			'```' + JSON.stringify(tatumResponse, null, 4) + '```'
		);

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const webhook = handler;
