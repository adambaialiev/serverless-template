import { gql } from 'graphql-request';

export default function buildDexTradesQueryForSymbol(
	symbol: string,
	since: string,
	till: string
) {
	return gql`
    {
      EVM(dataset: combined, network: eth) {
        sellside: DEXTradeByTokens(
          orderBy: { descending: Block_Time }
          where: {
            Trade: {
              Currency: {
                Symbol: {
                  is: "${symbol}"
                }
              }
            }
            Block: { Time: { since: "${since}", till: "${till}" } }
          }
        ) {
          Block {
            Number
            Time
          }
          Transaction {
            From
            To
            Hash
            Cost
          }
          Trade {
            Buyer
            Seller
            Amount
            Currency {
              Symbol
              SmartContract
              Name
              Decimals
            }
            Price
            Sender
            Side {
              Amount
              Buyer
              Seller
              Currency {
                Symbol
                SmartContract
                Name
                Decimals
              }
            }
          }
        }
      }
    }
  `;
}
