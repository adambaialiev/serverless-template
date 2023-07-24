import { gql } from "graphql-request";

export default function buildDexTradesQuery(
  contractAddress: string,
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
                SmartContract: {
                  is: "${contractAddress}"
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
