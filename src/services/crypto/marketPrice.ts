import axios from 'axios';
import AWS from 'aws-sdk';
import { TableKeys } from '@/common/dynamo/schema';

const API_URL = process.env.COIN_MARKET_CAP_API_URL;
const API_KEY = process.env.COIN_MARKET_CAP_API_KEY;

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table;

export class CryptoMarketPrice {
	async getPrices(): Promise<Record<string, number>> {
		try {
			const response = await axios.get(
				`${API_URL}/cryptocurrency/quotes/latest?symbol=BTC,ETH,MATIC,USDT,USDC`,
				{
					headers: {
						'Content-Type': 'application/json',
						'X-CMC_PRO_API_KEY': `${API_KEY}`,
					},
				}
			);

			const prices: Record<string, number> = {};

			if (response.data) {
				prices.BTC = response.data.data.BTC[0].quote.USD.price;
				prices.ETH = response.data.data.ETH[0].quote.USD.price;
				prices.MATIC = response.data.data.MATIC[0].quote.USD.price;
				prices.USDT = response.data.data.USDT[0].quote.USD.price;
				prices.USDC = response.data.data.USDC[0].quote.USD.price;
			}

			return prices;
		} catch (error) {
			console.log({ CryptoMarketServiceError: error });
			if (error instanceof Error) {
				throw new Error(error.message);
			}
		}
	}

	async getPricesFromDb() {
		return (
			await dynamoDb
				.get({
					TableName,
					Key: {
						[TableKeys.PK]: 'CRYPTO_PRICES#',
						[TableKeys.SK]: 'CRYPTO_PRICES#',
					},
				})
				.promise()
		).Item;
	}
}
