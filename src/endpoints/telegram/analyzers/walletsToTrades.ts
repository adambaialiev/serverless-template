import { TradeDataItem } from "../analyzer";

export type WalletsToTrades = {
  [key: string]: {
    count: number;
    trades: TradeDataItem[];
  };
};

const analyzer = (map: WalletsToTrades) => (tradeData: TradeDataItem) => {
  const trade = tradeData["Trade"];
  const buyer = trade.Buyer;
  const seller = trade.Seller;

  const tradeParticipants = [buyer, seller];

  tradeParticipants.forEach((p) => {
    if (!map[p]) {
      map[p] = {
        count: 1,
        trades: [tradeData],
      };
    } else {
      if (
        !map[p].trades.find(
          (t) => t.Transaction.Hash === tradeData.Transaction.Hash
        )
      ) {
        map[p].count++;
        map[p].trades.push(tradeData);
      }
    }
  });
};

export default function getWalletsToTradesMap(buyside: TradeDataItem[]) {
  const map: WalletsToTrades = {};
  buyside.forEach(analyzer(map));
  return map;
}
