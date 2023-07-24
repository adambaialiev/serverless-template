import { Entities } from '@/common/dynamo/schema';

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
	buildKey(Entities.USER, phoneNumber);

export const buildTelegramUserKey = (id: string) =>
	buildKey(Entities.TELEGRAM_USER, id);

export const buildUserWalletKey = (address: string) =>
	buildKey(Entities.USER_WALLET, address);

export const buildTransactionKey = (id: string) =>
	buildKey(Entities.TRANSACTION, id);

export const buildFeedbackKey = (id: string) => buildKey(Entities.FEEDBACK, id);

export const buildSupportTicketKey = (id: string) =>
	buildKey(Entities.SUPPORT_TICKET, id);

export const buildIncrementTransactionKey = (hash: string) =>
	buildKey(Entities.INCREMENT_TRANSACTION, hash);

export const buildDecrementTransactionKey = (hash: string) =>
	buildKey(Entities.DECREMENT_TRANSACTION, hash);

export const buildWithdrawToProcessKey = (hash: string) =>
	buildKey(Entities.WITHDRAW_TO_PROCESS, hash);

export const buildHomeTransactionKey = (hash: string) =>
	buildKey(Entities.HOME_TRANSACTION, hash);

export const buildDepositToValidateKey = (hash: string) =>
	buildKey(Entities.DEPOSIT_TO_VALIDATE, hash);

export const buildMonitoringUserIosKey = (id: string) =>
	buildKey(Entities.MONITORING_USER_IOS, id);

export const buildMonitoringUserAndroidKey = (id: string) =>
	buildKey(Entities.MONITORING_USER_ANDROID, id);

export const buildMonitoringSessionKey = (id: string) =>
	buildKey(Entities.MONITORING_SESSION, id);
