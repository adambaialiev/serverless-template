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

export enum TransactionAttributes {
  ID = "id",
  SOURCE = "source",
  TARGET = "target",
  AMOUNT = "amount",
  DATE = "date",
  STATUS = "status",
  TYPE = "type",
}
