import { CoinToTrades } from "./singleWalletPerformance";

interface WalletPerformanceSummary {
  expense: number;
  revenue: number;
  profit: number;
}

export const getSingleWalletPerformanceSummary = (map: CoinToTrades) => {
  const initial: WalletPerformanceSummary = {
    expense: 0,
    revenue: 0,
    profit: 0,
  };
  return Object.keys(map).reduce((acc, coin) => {
    const item = map[coin];
    if (item && item.performance && !item.performance.firstTradeIsSell) {
      acc.expense += item.performance.expense;
      acc.revenue += item.performance.revenue;
      acc.profit += item.performance.profit;
    }
    return acc;
  }, initial);
};
