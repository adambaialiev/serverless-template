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
	STORE = 'STORE',
	USER = 'USER#',
	USER_WALLET = 'USER_WALLET#',
	FEEDBACK = 'FEEDBACK#',
	TRANSACTION_REQUEST = 'TRANSACTION_REQUEST#',
	TRANSACTION = 'TRANSACTION#',
	INCREMENT_TRANSACTION = 'INCREMENT_TRANSACTION#',
	DECREMENT_TRANSACTION = 'DECREMENT_TRANSACTION#',
}

export enum MasterWalletAttributes {
	PUBLIC_ADDRESS = 'publicAddress',
	PRIVATE_KEY = 'privateKey',
	NETWORK = 'network',
	CREATED_AT = 'createdAt',
}

export interface MasterWalletItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[MasterWalletAttributes.PUBLIC_ADDRESS]: DocumentClient.String;
	[MasterWalletAttributes.PRIVATE_KEY]: DocumentClient.String;
	[MasterWalletAttributes.NETWORK]: DocumentClient.String;
	[MasterWalletAttributes.CREATED_AT]: DocumentClient.String;
}

export enum StoreAttributes {
	UPDATED_AT = 'updatedAt',
	VALUES = 'values',
}

export interface StoreItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[StoreAttributes.UPDATED_AT]: DocumentClient.String;
	[StoreAttributes.VALUES]: DocumentClient.AttributeMap;
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

export enum UserWalletAttributes {
	ADDRESS = 'address',
	PHONE_NUMBER = 'phoneNumber',
}

export interface UserWalletItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[UserWalletAttributes.ADDRESS]: DocumentClient.String;
	[UserWalletAttributes.PHONE_NUMBER]: DocumentClient.String;
}
export enum FeedbackAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	COMMENT = 'comment',
	RATING = 'rating',
	USER = 'user',
}

export interface FeedbackItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[FeedbackAttributes.COMMENT]: DocumentClient.String;
	[FeedbackAttributes.CREATED_AT]: DocumentClient.String;
	[FeedbackAttributes.UPDATED_AT]: DocumentClient.String;
	[FeedbackAttributes.RATING]: DocumentClient.NumberAttributeValue;
	[FeedbackAttributes.USER]: DocumentClient.String;
}

export enum TransactionRequestAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	COMMENT = 'comment',
	AMOUNT = 'amount',
	SOURCE = 'source',
	STATUS = 'status',
	TARGET = 'target',
	TYPE = 'type',
}

export interface TransactionRequestItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[TransactionRequestAttributes.COMMENT]: DocumentClient.String;
	[TransactionRequestAttributes.SOURCE]: DocumentClient.String;
	[TransactionRequestAttributes.STATUS]: DocumentClient.String;
	[TransactionRequestAttributes.AMOUNT]: DocumentClient.NumberAttributeValue;
	[TransactionRequestAttributes.TARGET]: DocumentClient.String;
	[TransactionRequestAttributes.CREATED_AT]: DocumentClient.String;
	[TransactionRequestAttributes.UPDATED_AT]: DocumentClient.String;
	[TransactionRequestAttributes.ID]: DocumentClient.String;
	[TransactionRequestAttributes.TYPE]: DocumentClient.String;
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
	CREATED_AT = 'createdAt',
	STATUS = 'status',
	TYPE = 'type',
	COMMENT = 'comment',
}

export interface TransactionItem {
	[TransactionAttributes.ID]: DocumentClient.String;
	[TransactionAttributes.SOURCE]: DocumentClient.String;
	[TransactionAttributes.TARGET]: DocumentClient.String;
	[TransactionAttributes.AMOUNT]: DocumentClient.String;
	[TransactionAttributes.CREATED_AT]: DocumentClient.String;
	[TransactionAttributes.STATUS]: DocumentClient.String;
	[TransactionAttributes.TYPE]: DocumentClient.String;
}

export interface ITransaction {
	id: string;
	source: string;
	target: string;
	amount: number;
	createdAt: string;
	status: 'pending' | 'success';
	type: 'in' | 'out' | 'deposit' | 'withdraw';
}

export enum IncrementTransactionAttributes {
	ID = 'id',
	PHONE_NUMBER = 'phoneNumber',
	AMOUNT = 'amount',
	CREATED_AT = 'createdAt',
	ADDRESS = 'address',
}

export interface IncrementTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[IncrementTransactionAttributes.ID]: DocumentClient.String;
	[IncrementTransactionAttributes.PHONE_NUMBER]: DocumentClient.String;
	[IncrementTransactionAttributes.AMOUNT]: DocumentClient.NumberAttributeValue;
	[IncrementTransactionAttributes.CREATED_AT]: DocumentClient.String;
	[IncrementTransactionAttributes.ADDRESS]: DocumentClient.String;
}

export enum DecrementTransactionAttributes {
	ID = 'id',
	PHONE_NUMBER = 'phoneNumber',
	AMOUNT = 'amount',
	CREATED_AT = 'createdAt',
	ADDRESS = 'address',
}

export interface DecrementTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[DecrementTransactionAttributes.ID]: DocumentClient.String;
	[DecrementTransactionAttributes.PHONE_NUMBER]: DocumentClient.String;
	[DecrementTransactionAttributes.AMOUNT]: DocumentClient.NumberAttributeValue;
	[DecrementTransactionAttributes.CREATED_AT]: DocumentClient.String;
	[DecrementTransactionAttributes.ADDRESS]: DocumentClient.String;
}

export enum WithdrawalToProcessAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	AMOUNT = 'amount',
	NETWORK = 'network',
	PHONE_NUMBER = 'phoneNumber',
	ADDRESS = 'address',
}

export interface WithdrawalTransactionItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[WithdrawalToProcessAttributes.ID]: DocumentClient.String;
	[WithdrawalToProcessAttributes.CREATED_AT]: DocumentClient.String;
	[WithdrawalToProcessAttributes.AMOUNT]: DocumentClient.String;
	[WithdrawalToProcessAttributes.NETWORK]: DocumentClient.String;
	[WithdrawalToProcessAttributes.PHONE_NUMBER]: DocumentClient.String;
	[WithdrawalToProcessAttributes.ADDRESS]: DocumentClient.String;
}
