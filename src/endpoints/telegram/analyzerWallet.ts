import { GraphQLClient } from 'graphql-request';
import buildDexTradesForWalletQuery from './queryBuilders/dexTradesForWallet';
import { TradeData, apiKey } from './analyzer';
import { getSingleWalletPerformanceResult } from './analyzers/singleWalletPerformance';
import { getSingleWalletPerformanceSummary } from './analyzers/singleWalletPerformanceSummary';

export interface Currency {
	Decimals: number;
	Name: string;
	SmartContract: string;
	Symbol: string;
}

export default async function analyzerWallet(wallet: string) {
	const endpoint = 'https://streaming.bitquery.io/graphql';

	const client = new GraphQLClient(endpoint, {
		headers: {
			'X-API-KEY': apiKey,
		},
	});
	const result = (await client.request(
		buildDexTradesForWalletQuery(wallet)
	)) as any;
	const data = result['EVM'] as TradeData;

	const singleWalletPerformance = getSingleWalletPerformanceResult(
		data.sellside
	);

	const singleWalletPerformanceSummary = getSingleWalletPerformanceSummary(
		singleWalletPerformance
	);

	return {
		singleWalletPerformanceSummary,
		singleWalletPerformance,
		data,
	};
}
