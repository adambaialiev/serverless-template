import { TableKeys } from '@/common/dynamo/schema';
import { CryptoMarketPrice } from '@/services/crypto/marketPrice';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import axios from "axios";
import { getRelevantDotEnvVariable } from "@/utils/getRelevantDotEnvVariable";

const marketPricesService = new CryptoMarketPrice();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table;

const slackUrl = getRelevantDotEnvVariable('SLACK_UPDATE_PRICES_URL') as string;

export const updatePrices = async () => {
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

		await axios.post(slackUrl, {
			text: `Endpoint updatePrices has been executed.`,
		});

		return sendResponse(200, cryptoPrices);
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
