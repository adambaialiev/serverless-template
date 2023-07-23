import { APIGatewayProxyHandler } from 'aws-lambda';
import { CustomAPIGateway } from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import {
	Entities,
	TableKeys,
	TelegramUserAttributes,
} from '@/common/dynamo/schema';
import { buildTelegramUserKey } from '@/common/dynamo/buildKey';
import AWS from 'aws-sdk';
import axios from 'axios';

const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

interface TelegramPayload {
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

interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	username: string;
	language_code: string;
}

interface TelegramUserData {
	requestsMade: number;
	walletsFound: number;
}

const processMessage = (payload: TelegramPayload) => {
	const { text } = payload.message;
	if (payload.message.text.startsWith('/start')) {
		return 'Welcome to ShopWallet. I will help you find profitable wallets for your research. Send me a message in the format: Contract_Address Start_Date End_Date. Date format is YYYY-MM-DD. Example of a valid request: 0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F 2023-07-18 2023-07-21. Good luck!';
	}
	const [contractAddress, since, till] = text.split(' ');
	if (!contractAddress || !since || !till) {
		return 'Please provide a valid message in the format: Contract_Address Start_Date End_Date. Date format is YYYY-MM-DD. Example of a valid request: 0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F 2023-07-18 2023-07-21';
	}
	return 'Analyzing...';
};

const sendMessage = async (chatId: number, text: string) => {
	const url = `${TELEGRAM_API_BASE_URL}/sendMessage`;
	const data = {
		chat_id: chatId,
		text,
	};
	await axios.post(url, data);
};

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	const dynamo = new AWS.DynamoDB.DocumentClient();

	const TableName = process.env.dynamo_table as string;
	try {
		const body = JSON.parse(event.body) as TelegramPayload;
		console.log(JSON.stringify(body, null, 4));
		const text = body.message.text;

		if (text.startsWith('/start')) {
			console.log('handling start');
			// save user to db
			const user = body.message.from;
			const userData: TelegramUserData = {
				requestsMade: 0,
				walletsFound: 0,
			};

			const userItem = {
				[TableKeys.PK]: Entities.TELEGRAM_USER,
				[TableKeys.SK]: buildTelegramUserKey(user.id.toString()),
				[TelegramUserAttributes.ID]: user.id.toString(),
				[TelegramUserAttributes.META]: user,
				[TelegramUserAttributes.DATA]: userData,
				[TelegramUserAttributes.IS_PREMIUM]: false,
			};

			try {
				await dynamo
					.put({
						Item: userItem,
						TableName,
						ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
					})
					.promise();
			} catch (error) {
				console.log({ error });
			}
		}

		const response = processMessage(body);

		try {
			await sendMessage(body.message.chat.id, response);
		} catch (error) {
			//
		}

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
