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
	MASTER_WALLET = 'MASTER_WALLET',
	USER = 'USER#',
	TRANSACTION = 'TRANSACTION#',
	INCREMENT_TRANSACTION = 'INCREMENT_TRANSACTION#',
	DECREMENT_TRANSACTION = 'DECREMENT_TRANSACTION#',
	TOUCH_PENDING = 'TOUCH_PENDING#',
	TOUCH_SUCCESS = 'TOUCH_SUCCESS#',
	HOME_PENDING = 'HOME_PENDING#',
	HOME_SUCCESS = 'HOME_SUCCESS#',
	WITHDRAWAL_PENDING = 'WITHDRAWAL_PENDING#',
	WITHDRAWAL_SUCCESS = 'WITHDRAWAL_SUCCESS#',
}

export enum MasterWalletInvolvedTransactionAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	AMOUNT = 'amount',
	NETWORK = 'network',
	PHONE_NUMBER = 'phoneNumber',
}

export interface MasterWalletInvolvedTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[MasterWalletInvolvedTransactionAttributes.ID]: DocumentClient.String;
	[MasterWalletInvolvedTransactionAttributes.CREATED_AT]: DocumentClient.String;
	[MasterWalletInvolvedTransactionAttributes.AMOUNT]: DocumentClient.String;
	[MasterWalletInvolvedTransactionAttributes.NETWORK]: DocumentClient.String;
	[MasterWalletInvolvedTransactionAttributes.PHONE_NUMBER]: DocumentClient.String;
}

export interface IMasterWalletInvolvedTransaction {
	id: string;
	createdAt: string;
	amount: string;
	network: string;
	phoneNumber: string;
}

export enum TouchSuccessAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	AMOUNT = 'amount',
	NETWORK = 'network',
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

export enum MasterWalletAttributes {
	PUBLIC_ADDRESS = 'publicAddress',
	PRIVATE_KEY = 'privateKey',
	NETWORK = 'network',
}

export interface MasterWalletItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[MasterWalletAttributes.PUBLIC_ADDRESS]: DocumentClient.String;
	[MasterWalletAttributes.PRIVATE_KEY]: DocumentClient.String;
	[MasterWalletAttributes.NETWORK]: DocumentClient.String;
}

export enum TransactionAttributes {
	ID = 'id',
	SOURCE = 'source',
	TARGET = 'target',
	AMOUNT = 'amount',
	DATE = 'date',
	STATUS = 'status',
	TYPE = 'type',
	COMMENT = 'comment',
}

export interface TransactionItem {
	[TransactionAttributes.ID]: DocumentClient.String;
	[TransactionAttributes.SOURCE]: DocumentClient.String;
	[TransactionAttributes.TARGET]: DocumentClient.String;
	[TransactionAttributes.AMOUNT]: DocumentClient.String;
	[TransactionAttributes.DATE]: DocumentClient.String;
	[TransactionAttributes.STATUS]: DocumentClient.String;
	[TransactionAttributes.TYPE]: DocumentClient.String;
}

export interface ITransaction {
	id: string;
	source: string;
	target: string;
	amount: number;
	date: string;
	status: 'pending' | 'success';
	type: 'in' | 'out' | 'deposit' | 'withdraw';
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

export enum DecrementTransactionAttributes {
	ID = 'id',
	PHONE_NUMBER = 'phoneNumber',
	AMOUNT = 'amount',
}

export interface DecrementTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[DecrementTransactionAttributes.ID]: DocumentClient.String;
	[DecrementTransactionAttributes.PHONE_NUMBER]: DocumentClient.String;
	[DecrementTransactionAttributes.AMOUNT]: DocumentClient.NumberAttributeValue;
}
