import { CoinToTrades } from './singleWalletPerformance';

export interface WalletPerformanceSummary {
	expense: number;
	revenue: number;
	profit: number;
	buyTrades: number;
	sellTrades: number;
}

export const getSingleWalletPerformanceSummary = (map: CoinToTrades) => {
	const initial: WalletPerformanceSummary = {
		expense: 0,
		revenue: 0,
		profit: 0,
		buyTrades: 0,
		sellTrades: 0,
	};
	return Object.keys(map).reduce((acc, coin) => {
		const item = map[coin];
		if (item && item.performance && !item.performance.firstTradeIsSell) {
			acc.expense += item.performance.expense;
			acc.revenue += item.performance.revenue;
			acc.profit += item.performance.profit;
			acc.buyTrades += item.buyTradesCount;
			acc.sellTrades += item.sellTradesCount;
		}
		return acc;
	}, initial);
};
