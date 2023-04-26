import { TableKeys } from '@/common/dynamo/schema';
import { CryptoMarketPrice } from '@/services/crypto/marketPrice';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import { SlackNotifications } from '@/utils/slackNotifications';
import { APIGatewayProxyHandler } from 'aws-lambda';

const marketPricesService = new CryptoMarketPrice();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table;

export const updatePrices: APIGatewayProxyHandler = async (event) => {
	try {
		const cryptoPrices = await marketPricesService.getPrices();

		await dynamoDb
			.put({
				TableName,
				Item: {
					[TableKeys.PK]: 'CRYPTO_PRICES#',
					[TableKeys.SK]: 'CRYPTO_PRICES#',
					prices: cryptoPrices,
				},
			})
			.promise();

		const sourceCountryCode = event.headers['CloudFront-Viewer-Country'];
		await SlackNotifications.sendMessage(
			'updatePrices',
			'SLACK_UPDATE_PRICES_URL',
			sourceCountryCode
		);

		return sendResponse(200, cryptoPrices);
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
