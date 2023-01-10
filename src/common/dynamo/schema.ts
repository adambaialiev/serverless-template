import { DocumentClient } from "aws-sdk/clients/dynamodb";

export enum TableKeys {
  PK = "PK",
  SK = "SK",
}

export enum Entities {
  USER = "USER#",
  TRANSACTION = "TRANSACTION#",
}

export enum UserAttributes {
  ID = "id",
  PHONE_NUMBER = "phoneNumber",
  FIRST_NAME = "firstName",
  LAST_NAME = "lastName",
  EMAIL = "email",
  BALANCE = "balance",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
}

export interface UserItem {
  [TableKeys.PK]: DocumentClient.String;
  [TableKeys.SK]: DocumentClient.String;
  [UserAttributes.ID]: DocumentClient.String;
  [UserAttributes.PHONE_NUMBER]: DocumentClient.String;
  [UserAttributes.FIRST_NAME]: DocumentClient.String;
  [UserAttributes.LAST_NAME]: DocumentClient.String;
  [UserAttributes.EMAIL]: DocumentClient.String;
  [UserAttributes.BALANCE]: DocumentClient.NumberAttributeValue;
  [UserAttributes.CREATED_AT]: DocumentClient.String;
  [UserAttributes.UPDATED_AT]: DocumentClient.String;
}

export enum TransactionAttributes {
  ID = "id",
  SOURCE = "source",
  TARGET = "target",
  AMOUNT = "amount",
  DATE = "date",
  STATUS = "status",
  TYPE = "type",
}
