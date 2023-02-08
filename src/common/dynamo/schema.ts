import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export enum TableKeys {
	PK = 'PK',
	SK = 'SK',
	GSI1PK = 'GSI1PK',
	GSI1SK = 'GSI1SK',
}

export enum IndexNames {
	GSI1 = 'GSI1',
}

export enum Entities {
	USER = 'USER#',
	TRANSACTION = 'TRANSACTION#',
	INCREMENT_TRANSACTION = 'INCREMENT_TRANSACTION#',
	MASTER_WALLET = 'MASTER_WALLET',
	MASTER_WALLET_TRANSACTION = 'MASTER_WALLET_TRANSACTION#',
}

export enum MasterWalletTransactionAttributes {
	ID = 'id',
	AMOUNT = 'amount',
	FROM = 'from',
	TO = 'to',
	STATUS = 'status',
	TYPE = 'type',
	NETWORK = 'network',
	USER_PHONE_NUMBER = 'userPhoneNumber',
}

export enum UserAttributes {
	ID = 'id',
	PHONE_NUMBER = 'phoneNumber',
	FIRST_NAME = 'firstName',
	LAST_NAME = 'lastName',
	EMAIL = 'email',
	BALANCE = 'balance',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	SESSION_ID = 'sessionId',
	OTP_CODE = 'otpCode',
	ACCESS_TOKEN = 'accessToken',
	REFRESH_TOKEN = 'refreshToken',
	WALLETS = 'wallets',
	PUSH_TOKEN = 'pushToken',
}

export enum MasterWalletAttributes {
	PUBLIC_ADDRESS = 'publicAddress',
	PRIVATE_KEY = 'privateKey',
}

export interface MasterWalletItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[MasterWalletAttributes.PUBLIC_ADDRESS]: DocumentClient.String;
	[MasterWalletAttributes.PRIVATE_KEY]: DocumentClient.String;
}

export interface MasterWalletTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[MasterWalletTransactionAttributes.ID]: DocumentClient.String;
	[MasterWalletTransactionAttributes.AMOUNT]: DocumentClient.NumberAttributeValue;
	[MasterWalletTransactionAttributes.FROM]: DocumentClient.String;
	[MasterWalletTransactionAttributes.TO]: DocumentClient.String;
	[MasterWalletTransactionAttributes.STATUS]: DocumentClient.String;
	[MasterWalletTransactionAttributes.TYPE]: DocumentClient.String;
	[MasterWalletTransactionAttributes.NETWORK]: DocumentClient.String;
	[MasterWalletTransactionAttributes.USER_PHONE_NUMBER]: DocumentClient.String;
}

export interface IMasterWalletTransaction {
	id: string;
	amount: number;
	from: string;
	to: string;
	status: 'pending' | 'success';
	type: 'home' | 'touch' | 'withdraw';
	network: 'polygon';
	userPhoneNumber: string;
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
	[UserAttributes.SESSION_ID]: DocumentClient.String;
	[UserAttributes.OTP_CODE]: DocumentClient.String;
	[UserAttributes.ACCESS_TOKEN]: DocumentClient.String;
	[UserAttributes.REFRESH_TOKEN]: DocumentClient.String;
	[UserAttributes.WALLETS]: DocumentClient.ListAttributeValue;
	[UserAttributes.PUSH_TOKEN]: DocumentClient.String;
}

export enum TransactionAttributes {
	ID = 'id',
	SOURCE = 'source',
	TARGET = 'target',
	AMOUNT = 'amount',
	DATE = 'date',
	STATUS = 'status',
	TYPE = 'type',
}

export enum IncrementTransactionAttributes {
	ID = 'id',
	PHONE_NUMBER = 'phoneNumber',
	AMOUNT = 'amount',
}

export interface IncrementTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[IncrementTransactionAttributes.ID]: DocumentClient.String;
	[IncrementTransactionAttributes.PHONE_NUMBER]: DocumentClient.String;
	[IncrementTransactionAttributes.AMOUNT]: DocumentClient.NumberAttributeValue;
}
