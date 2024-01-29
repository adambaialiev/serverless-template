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
	CREATOR = 'CREATOR#',
	COURSE = 'COURSE#',
	ASSISTANT = 'ASSISTANT#',
	ASSISTANT_RESPONSE = 'ASSISTANT_RESPONSE#',
	PENDING_RUN = 'PENDING_RUN#',
}

export enum AssistantResponseAttributes {
	ID = 'id',
	MESSAGE_ID = 'messageId',
	RESPONSE = 'response',
	PROMPT = 'prompt',
	CREATED_AT = 'createdAt',
	COUNTRY = 'country',
	IDENTITY = 'identity',
	IS_PUBLIC = 'isPublic',
}

export interface AssistantResponseItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[AssistantResponseAttributes.ID]: DocumentClient.String;
	[AssistantResponseAttributes.PROMPT]: DocumentClient.String;
	[AssistantResponseAttributes.CREATED_AT]: DocumentClient.String;
}

export enum AssistantAttributes {
	ID = 'id',
	OPEN_AI_ASSISTANT_ID = 'openAiAssistantId',
	NAME = 'name',
	AUTHOR = 'author',
	MODEL = 'model',
	INSTRUCTIONS = 'instructions',
	PDF_KEY = 'pdfKey',
	COVER_IMAGE_URL = 'coverImageUrl',
	CHAPTERS_LIST = 'chaptersList',
	CHAPTERS_SUMMARIES = 'chaptersSummaries',
	GENERAL_SUMMARY = 'generalSummary',
	CREATED_AT = 'createdAt',
	STATUS = 'status',
	FILE_ID = 'fileId',
	OPEN_AI_KEY = 'openAiKey',
}

export type AssistantItem = {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[AssistantAttributes.ID]: DocumentClient.String;
	[AssistantAttributes.OPEN_AI_ASSISTANT_ID]: DocumentClient.String;
	[AssistantAttributes.NAME]: DocumentClient.String;
	[AssistantAttributes.AUTHOR]: DocumentClient.String;
	[AssistantAttributes.MODEL]: DocumentClient.String;
	[AssistantAttributes.INSTRUCTIONS]: DocumentClient.String;
	[AssistantAttributes.PDF_KEY]: DocumentClient.String;
	[AssistantAttributes.COVER_IMAGE_URL]: DocumentClient.String;
	[AssistantAttributes.CHAPTERS_LIST]: DocumentClient.ListAttributeValue;
	[AssistantAttributes.CHAPTERS_SUMMARIES]: DocumentClient.ListAttributeValue;
	[AssistantAttributes.GENERAL_SUMMARY]: DocumentClient.String;
	[AssistantAttributes.CREATED_AT]: DocumentClient.String;
	[AssistantAttributes.STATUS]: DocumentClient.String;
};

export enum PendingRunAttributes {
	ID = 'id',
	ASSISTANT_ID = 'assistantId',
	USER_ID = 'userId',
	THREAD_ID = 'threadId',
	CREATED_AT = 'createdAt',
	JOB_TYPE = 'jobType',
	CHAPTER_NAME = 'chapterName',
}

export type PendingRunItem = {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[PendingRunAttributes.ID]: DocumentClient.String;
	[PendingRunAttributes.ASSISTANT_ID]: DocumentClient.String;
	[PendingRunAttributes.USER_ID]: DocumentClient.String;
	[PendingRunAttributes.THREAD_ID]: DocumentClient.String;
	[PendingRunAttributes.CREATED_AT]: DocumentClient.String;
	[PendingRunAttributes.JOB_TYPE]: DocumentClient.String;
	[PendingRunAttributes.CHAPTER_NAME]: DocumentClient.String;
};

export enum JobType {
	CHAPTERS_LIST_EXTRACTION = 'chaptersListExtraction',
	CHAPTERS_SUMMARY_EXTRACTION = 'chaptersSummaryExtraction',
	GENERAL_SUMMARY_EXTRACTION = 'generalSummaryExtraction',
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

export enum CreatorAttributes {
	ID = 'id',
	NAME = 'name',
	CREATED_AT = 'createdAt',
}

export interface CreatorItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[CreatorAttributes.ID]: DocumentClient.String;
	[CreatorAttributes.NAME]: DocumentClient.String;
	[CreatorAttributes.CREATED_AT]: DocumentClient.String;
}

export enum CourseAttributes {
	ID = 'id',
	AUTHOR_ID = 'authorId',
	NAME = 'name',
	CREATED_AT = 'createdAt',
	IMAGE_URL = 'imageUrl',
	LESSONS = 'lessons',
}

export interface CourseItem {
	[TableKeys.PK]: DocumentClient.String;
	[TableKeys.SK]: DocumentClient.String;
	[CourseAttributes.ID]: DocumentClient.String;
	[CourseAttributes.AUTHOR_ID]: DocumentClient.String;
	[CourseAttributes.NAME]: DocumentClient.String;
	[CourseAttributes.CREATED_AT]: DocumentClient.String;
	[CourseAttributes.IMAGE_URL]: DocumentClient.String;
	[CourseAttributes.LESSONS]: DocumentClient.AttributeMap;
}
