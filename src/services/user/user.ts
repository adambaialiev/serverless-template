import AWS from "aws-sdk";
import { buildUserKey } from "../../common/dynamo/buildKey";
import { TableKeys, UserItem } from "../../common/dynamo/schema";
import { UserSlug } from "./types";
import { unmarshallUserSlug } from "./unmarshall";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export default class UserService {
  async getSlug(phoneNumber: string): Promise<UserSlug | undefined> {
    const tableName = process.env.dynamo_table;
    const userKey = buildUserKey(phoneNumber);
    const userOutput = await dynamoDB
      .get({
        TableName: tableName,
        Key: {
          [TableKeys.PK]: userKey,
          [TableKeys.SK]: userKey,
        },
      })
      .promise();

    if (userOutput.Item) {
      return unmarshallUserSlug(userOutput.Item as UserItem);
    }
    return undefined;
  }
}
