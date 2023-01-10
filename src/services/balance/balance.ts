import AWS from "aws-sdk";
import {
  buildTransactionKey,
  buildUserKey,
} from "../../common/dynamo/buildKey";
import {
  Entities,
  TableKeys,
  TransactionAttributes,
} from "../../common/dynamo/schema";
import { v4 } from "uuid";
import { UserSlug } from "../user/types";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export interface MakeTransactionProps {
  sourceId: string;
  targetId: string;
}

export default class BalanceService {
  async makeTransaction(source: UserSlug, target: UserSlug, amount: number) {
    const tableName = process.env.dynamo_table;

    const sourceUserKey = buildUserKey(source.phoneNumber);
    const targetUserKey = buildUserKey(target.phoneNumber);

    const sourceTransactionId = v4();
    const targetTransactionId = v4();

    console.log({
      sourceUserKey,
      targetUserKey,
      sourceTransactionId,
      targetTransactionId,
      amount,
      source,
      target,
      tableName,
    });

    const sourceTransactionKey = buildTransactionKey(sourceTransactionId);
    const targetTransactionKey = buildTransactionKey(targetTransactionId);

    const date = Date.now().toString();
    const status = "";

    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Put: {
              Item: {
                [TableKeys.PK]: sourceUserKey,
                [TableKeys.SK]: sourceTransactionKey,
                [TransactionAttributes.ID]: sourceTransactionId,
                [TransactionAttributes.SOURCE]: source,
                [TransactionAttributes.TARGET]: target,
                [TransactionAttributes.AMOUNT]: amount,
                [TransactionAttributes.DATE]: date,
                [TransactionAttributes.STATUS]: status,
                [TransactionAttributes.TYPE]: "out",
              },
              TableName: tableName,
              ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
            },
          },
          {
            Put: {
              Item: {
                [TableKeys.PK]: targetUserKey,
                [TableKeys.SK]: targetTransactionKey,
                [TransactionAttributes.ID]: targetTransactionId,
                [TransactionAttributes.SOURCE]: source,
                [TransactionAttributes.TARGET]: target,
                [TransactionAttributes.AMOUNT]: amount,
                [TransactionAttributes.DATE]: date,
                [TransactionAttributes.STATUS]: status,
                [TransactionAttributes.TYPE]: "in",
              },
              TableName: tableName,
              ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
            },
          },
          {
            Update: {
              TableName: tableName,
              Key: {
                [TableKeys.PK]: sourceUserKey,
                [TableKeys.SK]: sourceUserKey,
              },
              UpdateExpression: `SET #balance = #balance - :decrease`,
              ExpressionAttributeNames: {
                "#balance": "balance",
              },
              ExpressionAttributeValues: {
                ":decrease": amount,
              },
            },
          },
          {
            Update: {
              TableName: tableName,
              Key: {
                [TableKeys.PK]: targetUserKey,
                [TableKeys.SK]: targetUserKey,
              },
              UpdateExpression: `SET #balance = #balance + :increase`,
              ExpressionAttributeNames: {
                "#balance": "balance",
              },
              ExpressionAttributeValues: {
                ":increase": amount,
              },
            },
          },
        ],
      })
      .promise();
  }
}
