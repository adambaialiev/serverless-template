import { TradeDataItem } from '../analyzer';
import { WalletsToTrades } from './walletsToTrades';
import { WalletToType } from './walletsTypes';

export interface WalletPerformanceItem {
	expense: number;
	revenue: number;
	profit: number;
	buyTradesCount: number;
	sellTradesCount: number;
	tradesCount: number;
	trades?: TradeDataItem[];
}

export interface WalletsPerformance {
	[key: string]: WalletPerformanceItem;
}

const getPerformanceResult = (trades: TradeDataItem[], wallet: string) => {
	const initial: WalletPerformanceItem = {
		expense: 0,
		revenue: 0,
		profit: 0,
		buyTradesCount: 0,
		sellTradesCount: 0,
		tradesCount: 0,
	};
	const result = trades
		.slice()
		.reverse()
		.reduce((acc, trade) => {
			const isBuyTrade = wallet === trade.Trade.Buyer;
			const amount = Number(trade.Trade.Side.Amount);
			const isWETH = trade.Trade.Side.Currency.Symbol === 'WETH';
			if (isWETH) {
				if (isBuyTrade) {
					acc.expense += amount;
					acc.buyTradesCount += 1;
				} else {
					acc.revenue += amount;
					acc.sellTradesCount += 1;
				}
			}
			return acc;
		}, initial);
	result.profit = result.revenue - result.expense;
	result.tradesCount = trades.length;
	// result.trades = trades;
	return result;
};

export default function getWalletsPerformance(
	map: WalletsToTrades,
	walletsToType: WalletToType,
	removeSmartContracts: boolean
) {
	const performance: WalletsPerformance = {};
	Object.keys(map).forEach((wallet) => {
		const trades = map[wallet].trades;
		const result = getPerformanceResult(trades, wallet);
		performance[wallet] = result;
	});
	return Object.keys(performance)
		.filter((wallet) => {
			const item = performance[wallet];
			return item.expense > 0 && item.revenue > 0;
		})
		.filter((wallet) => {
			if (removeSmartContracts) {
				const address = walletsToType[wallet];
				return address && !address.smartContract;
			}
			return true;
		})
		.sort((a, b) => {
			const itemA = performance[a];
			const itemB = performance[b];
			return itemB.profit - itemA.profit;
		})
		.map((wallet) => {
			const item = performance[wallet];
			return [wallet, item];
		});
}
