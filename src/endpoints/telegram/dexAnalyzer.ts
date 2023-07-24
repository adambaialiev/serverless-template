import { buildTelegramUserKey } from '@/common/dynamo/buildKey';
import {
	TableKeys,
	TelegramUserAttributes,
	TelegramUserItem,
} from '@/common/dynamo/schema';
import analyzer from '@/endpoints/telegram/analyzer';
import { WalletPerformanceItem } from '@/endpoints/telegram/analyzers/walletsPerformance';
import {
	TelegramPayload,
	sendTelegramMessage,
} from '@/endpoints/telegram/webhook';
import { SQSEvent } from 'aws-lambda';
import AWS from 'aws-sdk';

export interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	username: string;
	language_code: string;
}

export interface TelegramUserData {
	requestsMade: number;
	walletsFound: number;
}

const dynamo = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

const handler = async (event: SQSEvent) => {
	try {
		for (const record of event.Records) {
			const { payload, contractAddress, startDate, endDate } = JSON.parse(
				record.body
			);
			console.log({ contractAddress, startDate, endDate });
			console.log(JSON.stringify(payload, null, 4));
			const telegramPayload = payload as TelegramPayload;
			const { message } = telegramPayload;
			let telegramUserItem: TelegramUserItem | undefined;
			try {
				const key = buildTelegramUserKey(message.from.id.toString());
				console.log({ key });
				const output = await dynamo
					.get({
						TableName,
						Key: {
							[TableKeys.PK]: key,
							[TableKeys.SK]: key,
						},
					})
					.promise();
				console.log({ userOutput: output.Item });
				if (output.Item) {
					telegramUserItem = output.Item as TelegramUserItem;
				}
			} catch (error) {
				console.log({ error });
			}
			try {
				const formattedSince = `${startDate}T00:00:00Z`;
				const formattedTill = `${endDate}T23:59:59Z`;
				const { walletsPerformance, tradesCount } = await analyzer(
					contractAddress,
					formattedSince,
					formattedTill
				);
				console.log({ walletsPerformance });
				console.log({ telegramUserItem });
				if (!telegramUserItem) {
					const user = message.from;
					const userData: TelegramUserData = {
						requestsMade: 1,
						walletsFound: walletsPerformance.length,
					};
					const key = buildTelegramUserKey(user.id.toString());
					const userItem = {
						[TableKeys.PK]: key,
						[TableKeys.SK]: key,
						[TelegramUserAttributes.ID]: user.id.toString(),
						[TelegramUserAttributes.META]: user,
						[TelegramUserAttributes.DATA]: userData,
						[TelegramUserAttributes.IS_PREMIUM]: false,
					};
					console.log(JSON.stringify(userItem, null, 4));
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
				} else {
					try {
						const previousData = telegramUserItem.data as TelegramUserData;
						const newData: TelegramUserData = {
							requestsMade: previousData.requestsMade + 1,
							walletsFound:
								previousData.walletsFound + walletsPerformance.length,
						};
						await dynamo
							.update({
								TableName,
								Key: {
									[TableKeys.PK]: buildTelegramUserKey(
										message.from.id.toString()
									),
									[TableKeys.SK]: buildTelegramUserKey(
										message.from.id.toString()
									),
								},
								UpdateExpression: `SET #data = :data`,
								ExpressionAttributeNames: {
									'#data': TelegramUserAttributes.DATA,
								},
								ExpressionAttributeValues: {
									':data': newData,
								},
							})
							.promise();
					} catch (error) {
						console.log({ error });
					}
				}
				const getFormattedPayloadMessage = () => {
					const previousData = telegramUserItem?.data as TelegramUserData;
					const shouldHideAddresses =
						previousData && previousData.walletsFound > 25;
					return walletsPerformance
						.map((item, index) => {
							const wallet = item[0] as string;
							const performance = item[1] as WalletPerformanceItem;
							return `\n${index + 1}. Address: ${
								shouldHideAddresses ? 'hidden' : wallet
							}. Profit is ${performance.profit} WETH`;
						})
						.join('');
				};
				const reply = `${tradesCount} DEX trades were analyzed. Profitable wallets found: ${
					walletsPerformance.length
				}.${getFormattedPayloadMessage()}`;
				await sendTelegramMessage(message.chat.id, reply);
			} catch (error) {
				console.log({ error });
				await sendTelegramMessage(
					message.chat.id,
					'An error occurred while fetching the data. Please provide a valid message in the format: Contract_Address Start_Date End_Date. Date format is YYYY-MM-DD. Example of a valid request: 0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F 2023-07-18 2023-07-21'
				);
			}
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
