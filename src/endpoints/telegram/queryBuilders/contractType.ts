import { gql } from "graphql-request";

export default function buildContractTypeQuery(address: string) {
  return gql`
    query MyQuery {
      ethereum(network: ethereum) {
        address(address: { is: "${address}" }) {
          address
          balance
          smartContract {
            contractType
          }
        }
      }
    }
  `;
}
