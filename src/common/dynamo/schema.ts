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
	TELEGRAM_USER = 'TELEGRAM_USER#',
	USER_WALLET = 'USER_WALLET#',
	FEEDBACK = 'FEEDBACK#',
	SUPPORT_TICKET = 'SUPPORT_TICKET#',
	TRANSACTION = 'TRANSACTION#',
	INCREMENT_TRANSACTION = 'INCREMENT_TRANSACTION#',
	DECREMENT_TRANSACTION = 'DECREMENT_TRANSACTION#',
	WITHDRAW_TO_PROCESS = 'WITHDRAW_TO_PROCESS#',
	HOME_TRANSACTION = 'HOME_TRANSACTION#',
	DEPOSIT_TO_VALIDATE = 'DEPOSITS_TO_VALIDATE#',
	MONITORING_USER_IOS = 'MONITORING_USER_IOS#',
	MONITORING_USER_ANDROID = 'MONITORING_USER_ANDROID#',
	MONITORING_SESSION = 'MONITORING_SESSION#',
}

export enum MasterWalletAttributes {
	PUBLIC_ADDRESS = 'publicAddress',
	PRIVATE_KEY = 'privateKey',
	NETWORK = 'network',
	CREATED_AT = 'createdAt',
	PHONE_NUMBER = 'phoneNumber',
}

export interface MasterWalletItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[MasterWalletAttributes.PUBLIC_ADDRESS]: DocumentClient.String;
	[MasterWalletAttributes.PRIVATE_KEY]: DocumentClient.String;
	[MasterWalletAttributes.NETWORK]: DocumentClient.String;
	[MasterWalletAttributes.CREATED_AT]: DocumentClient.String;
}

export interface CryptoPricesItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	prices: DocumentClient.AttributeMap;
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

export enum TelegramUserAttributes {
	ID = 'id',
	META = 'meta',
	CHAT_ID = 'chatId',
	DATA = 'data',
	IS_PREMIUM = 'isPremium',
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
	AVATAR = 'avatar',
	UNREAD_NOTIFICATIONS = 'unreadNotifications',
	WITHDRAWAL_ADDRESSES = 'withdrawalAddresses',
}

export enum UserWalletAttributes {
	ADDRESS = 'address',
	PRIVATE_KEY = 'privateKey',
	PHONE_NUMBER = 'phoneNumber',
}

export interface UserWalletItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[UserWalletAttributes.ADDRESS]: DocumentClient.String;
	[UserWalletAttributes.PRIVATE_KEY]: DocumentClient.String;
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

export enum SupportTicketAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	DESCRIPTION = 'description',
	EMAIL = 'email',
	IS_RESOLVED = 'isResolved',
}

export interface IWithdrawalAddress {
	name: string;
	address: string;
	network: 'polygon';
	id: string;
}

export interface FeedbackItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[FeedbackAttributes.ID]: DocumentClient.String;
	[FeedbackAttributes.COMMENT]: DocumentClient.String;
	[FeedbackAttributes.CREATED_AT]: DocumentClient.String;
	[FeedbackAttributes.UPDATED_AT]: DocumentClient.String;
	[FeedbackAttributes.RATING]: DocumentClient.NumberAttributeValue;
	[FeedbackAttributes.USER]: DocumentClient.String;
}

export interface SupportTicketItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[SupportTicketAttributes.ID]: DocumentClient.String;
	[SupportTicketAttributes.CREATED_AT]: DocumentClient.String;
	[SupportTicketAttributes.UPDATED_AT]: DocumentClient.String;
	[SupportTicketAttributes.DESCRIPTION]: DocumentClient.String;
	[SupportTicketAttributes.EMAIL]: DocumentClient.String;
	[SupportTicketAttributes.IS_RESOLVED]: DocumentClient.BooleanAttributeValue;
}

export interface TelegramUserItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[TelegramUserAttributes.ID]: DocumentClient.String;
	[TelegramUserAttributes.META]: DocumentClient.AttributeMap;
	[TelegramUserAttributes.DATA]: DocumentClient.AttributeMap;
	[TelegramUserAttributes.IS_PREMIUM]: DocumentClient.BooleanAttributeValue;
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
	[UserAttributes.AVATAR]: DocumentClient.String;
	[UserAttributes.WALLETS]: DocumentClient.ListAttributeValue;
	[UserAttributes.WITHDRAWAL_ADDRESSES]: DocumentClient.ListAttributeValue;
	[UserAttributes.PUSH_TOKEN]: DocumentClient.String;
	[UserAttributes.UNREAD_NOTIFICATIONS]: DocumentClient.NumberAttributeValue;
}

export enum TransactionAttributes {
	ID = 'id',
	SOURCE = 'source',
	TARGET = 'target',
	AMOUNT = 'amount',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	STATUS = 'status',
	TYPE = 'type',
	COMMENT = 'comment',
	IS_READ = 'isRead',
	VALIDATION_NUMBER = 'validationNumber',
	ADDRESS = 'address',
}

export interface TransactionItem {
	[TransactionAttributes.ID]: DocumentClient.String;
	[TransactionAttributes.SOURCE]: DocumentClient.String;
	[TransactionAttributes.TARGET]: DocumentClient.String;
	[TransactionAttributes.AMOUNT]: DocumentClient.String;
	[TransactionAttributes.CREATED_AT]: DocumentClient.String;
	[TransactionAttributes.UPDATED_AT]: DocumentClient.String;
	[TransactionAttributes.STATUS]: DocumentClient.String;
	[TransactionAttributes.IS_READ]: DocumentClient.BooleanAttributeValue;
	[TransactionAttributes.COMMENT]: DocumentClient.BooleanAttributeValue;
	[TransactionAttributes.TYPE]: DocumentClient.String;
	[TransactionAttributes.VALIDATION_NUMBER]: DocumentClient.String;
}

export interface ITransaction {
	id: string;
	source: string;
	target: string;
	amount: number;
	createdAt: string;
	updatedAt: string;
	comment: string;
	status: 'pending' | 'accepted' | 'declined';
	type: 'request' | 'transaction' | 'deposit' | 'withdraw';
	isRead: boolean;
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

export enum WithdrawToProcessAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	AMOUNT = 'amount',
	NETWORK = 'network',
	PHONE_NUMBER = 'phoneNumber',
	ADDRESS = 'address',
}

export interface WithdrawToProcessItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[WithdrawToProcessAttributes.ID]: DocumentClient.String;
	[WithdrawToProcessAttributes.CREATED_AT]: DocumentClient.String;
	[WithdrawToProcessAttributes.AMOUNT]: DocumentClient.String;
	[WithdrawToProcessAttributes.NETWORK]: DocumentClient.String;
	[WithdrawToProcessAttributes.PHONE_NUMBER]: DocumentClient.String;
	[WithdrawToProcessAttributes.ADDRESS]: DocumentClient.String;
}

export enum DepositToValidateAttributes {
	ID = 'id',
	CREATED_AT = 'createdAt',
	AMOUNT = 'amount',
	NETWORK = 'network',
	PHONE_NUMBER = 'phoneNumber',
	ADDRESS = 'address',
	BLOCK_NUMBER = 'blockNum',
}

export interface DepositToValidateItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[DepositToValidateAttributes.ID]: DocumentClient.String;
	[DepositToValidateAttributes.CREATED_AT]: DocumentClient.String;
	[DepositToValidateAttributes.AMOUNT]: DocumentClient.String;
	[DepositToValidateAttributes.NETWORK]: DocumentClient.String;
	[DepositToValidateAttributes.PHONE_NUMBER]: DocumentClient.String;
	[DepositToValidateAttributes.ADDRESS]: DocumentClient.String;
	[DepositToValidateAttributes.BLOCK_NUMBER]: DocumentClient.String;
}

export enum MonitoringAttributes {
	EVENTS = 'events',
	DEVICE_INFO = 'deviceInfo',
	META_INFO = 'metaInfo',
	USER_ID = 'userId',
	SESSION_ID = 'sessionId',
	PLATFORM = 'platform',
	COUNTRY = 'country',
}
