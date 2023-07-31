import { TradeDataItem } from '../analyzer';

export interface CoinToTrades {
	[key: string]: {
		tradesCount: number;
		buyTradesCount: number;
		sellTradesCount: number;
		performance?: CoinPerformance;
		trades: TradeDataItem[];
	};
}

export interface CoinPerformance {
	firstTradeIsSell?: boolean;
	revenue: number;
	expense: number;
	profit: number;
}

const getPerformance = (trades: TradeDataItem[]) => {
	const initial: CoinPerformance = {
		revenue: 0,
		expense: 0,
		profit: 0,
	};
	const result = trades
		.slice()
		.reverse()
		.reduce((acc, trade, index) => {
			const isBuyTrade = 'WETH' !== trade.Trade.Currency.Symbol;
			const amount = isBuyTrade
				? Number(trade.Trade.Side.Amount)
				: Number(trade.Trade.Amount);

			if (isBuyTrade) {
				acc.expense += amount;
			} else {
				acc.revenue += amount;
			}

			if (index === 0 && !isBuyTrade) {
				acc.firstTradeIsSell = true;
			} else {
				acc.firstTradeIsSell = false;
			}

			return acc;
		}, initial);
	result.profit = result.revenue - result.expense;

	return result;
};

const analyzer = (map: CoinToTrades) => (tradeData: TradeDataItem) => {
	const trade = tradeData['Trade'];
	const getCurrency = () => {
		if (trade.Currency.Symbol === 'WETH') {
			return trade.Side.Currency.Symbol;
		}
		return trade.Currency.Symbol;
	};

	const currency = getCurrency();
	const isBuyTrade = 'WETH' !== trade.Currency.Symbol;
	if (!map[currency]) {
		map[currency] = {
			tradesCount: 1,
			buyTradesCount: isBuyTrade ? 1 : 0,
			sellTradesCount: isBuyTrade ? 0 : 1,
			trades: [tradeData],
		};
	} else if (
		!map[currency].trades.find(
			(t) => t.Transaction.Hash === tradeData.Transaction.Hash
		)
	) {
		const getLiquidCurrency = () => {
			return isBuyTrade ? trade.Side.Currency.Symbol : trade.Currency.Symbol;
		};
		if (getLiquidCurrency() === 'WETH') {
			map[currency].tradesCount++;
			map[currency].trades.push(tradeData);
			if (isBuyTrade) {
				map[currency].buyTradesCount++;
			} else {
				map[currency].sellTradesCount++;
			}
		}
	}
};

interface ProfitabilityOverTime {
	[key: string]: {
		revenue: number;
		expense: number;
		profit: number;
		ratio: string;
	};
}

const analyzeProfitabilityOverTime = (trades: TradeDataItem[]) => {
	const map: ProfitabilityOverTime = {};
	const analysis = trades
		.slice()
		.reverse()
		.reduce((acc, trade, index) => {
			const isBuyTrade = 'WETH' !== trade.Trade.Currency.Symbol;
			const amount = isBuyTrade
				? Number(trade.Trade.Side.Amount)
				: Number(trade.Trade.Amount);
			const getTimeKey = () => {
				const date = new Date(trade.Block.Time);
				const year = date.getFullYear();
				const month = date.getMonth();
				const day = date.getDate();
				return `${year}-${month}-${day};`;
			};
			if (index === 0 && isBuyTrade) {
				const timeKey = getTimeKey();
				if (!map[timeKey]) {
					map[timeKey] = {
						expense: 0,
						revenue: 0,
						profit: 0,
						ratio: '',
					};
					if (isBuyTrade) {
						map[timeKey].expense += amount;
					} else {
						map[timeKey].revenue += amount;
					}
				} else if (isBuyTrade) {
					map[timeKey].expense += amount;
				} else {
					map[timeKey].revenue += amount;
				}
			}
			return acc;
		}, map);
	Object.keys(analysis).forEach((timeKey) => {
		const item = analysis[timeKey];
		item.profit = item.revenue - item.expense;
		const getRatio = () => {
			return Math.floor(item.profit / item.expense) * 100;
		};
		item.ratio = `${getRatio()}%`;
	});
	return analysis;
};

export const getSingleWalletPerformanceResult = (trades: TradeDataItem[]) => {
	const coinToTradesMap: CoinToTrades = {};
	trades.forEach(analyzer(coinToTradesMap));
	Object.keys(coinToTradesMap).forEach((coin) => {
		const trades = coinToTradesMap[coin].trades;
		const result = getPerformance(trades);
		coinToTradesMap[coin].performance = result;
	});
	return {
		coinToTradesMap,
		profitabilityOverTime: analyzeProfitabilityOverTime(trades),
	};
};
