import { GraphQLClient } from 'graphql-request';
import buildDexTradesQuery from './queryBuilders/dexTrades';
import getWalletsToTradesMap from './analyzers/walletsToTrades';
import getWalletsPerformance, {
	WalletPerformanceItem,
} from './analyzers/walletsPerformance';
import getWalletsToType from './analyzers/walletsTypes';
import buildDexTradesQueryForSymbol from '@/endpoints/telegram/queryBuilders/dexTradesCurrencySymbol';

export interface Currency {
	Decimals: number;
	Name: string;
	SmartContract: string;
	Symbol: string;
}

export interface Trade {
	Amount: string;
	Buyer: string;
	Currency: Currency;
	Price: number;
	Seller: string;
	Sender: string;
	Side: {
		Amount: string;
		Buyer: string;
		Currency: Currency;
		Seller: string;
	};
}

export interface TradeDataItem {
	Block: {
		Number: string;
		Time: string;
	};
	Trade: Trade;
	Transaction: {
		From: string;
		Hash: string;
		To: string;
		Cost: string;
	};
}

interface TradeData {
	sellside: TradeDataItem[];
}

export const apiKey = 'BQYQVe7TwMsIG9LFCgphkTff6in7kr2w';

export default async function analyzer(
	contractAddress: string,
	since: string,
	till: string
) {
	const endpoint = 'https://streaming.bitquery.io/graphql';

	const client = new GraphQLClient(endpoint, {
		headers: {
			'X-API-KEY': 'BQYQVe7TwMsIG9LFCgphkTff6in7kr2w',
		},
	});
	const isContractAddress = contractAddress.startsWith('0x');
	const query = isContractAddress
		? buildDexTradesQuery(contractAddress, since, till)
		: buildDexTradesQueryForSymbol(contractAddress, since, till);
	const result = (await client.request(query)) as any;
	const data = result['EVM'] as TradeData;

	const walletsToTradesMap = getWalletsToTradesMap(data['sellside']);
	const walletsPerformanceWithSmartContracts = getWalletsPerformance(
		walletsToTradesMap,
		{},
		false
	);
	const profitableWallets = walletsPerformanceWithSmartContracts
		.filter((item) => {
			const payload = item[1] as WalletPerformanceItem;
			return payload.profit > 0;
		})
		.map((item) => item[0] as string);
	const walletsToType = await getWalletsToType(profitableWallets);
	const walletsPerformance = getWalletsPerformance(
		walletsToTradesMap,
		walletsToType,
		true
	);
	return {
		profitableWallets,
		walletsPerformance,
		walletsToTradesMap,
		walletsPerformanceWithSmartContracts,
		tradesCount: data['sellside'].length,
	};
}
