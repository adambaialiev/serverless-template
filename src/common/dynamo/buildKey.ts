import { Entities } from '@/common/dynamo/schema';

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
	buildKey(Entities.USER, phoneNumber);

export const buildTransactionKey = (id: string) =>
	buildKey(Entities.TRANSACTION, id);

export const buildFeedbackKey = (id: string) => buildKey(Entities.FEEDBACK, id);

export const buildIncrementTransactionKey = (hash: string) =>
	buildKey(Entities.INCREMENT_TRANSACTION, hash);

export const buildDecrementTransactionKey = (hash: string) =>
	buildKey(Entities.DECREMENT_TRANSACTION, hash);

export const buildTouchPendingKey = (hash: string) =>
	buildKey(Entities.TOUCH_PENDING, hash);

export const buildTouchSuccessKey = (hash: string) =>
	buildKey(Entities.TOUCH_SUCCESS, hash);

export const buildHomePendingKey = (hash: string) =>
	buildKey(Entities.HOME_PENDING, hash);

export const buildHomeSuccessKey = (hash: string) =>
	buildKey(Entities.HOME_SUCCESS, hash);

export const buildWithdrawalPendingKey = (hash: string) =>
	buildKey(Entities.WITHDRAWAL_PENDING, hash);

export const buildWithdrawalSuccessKey = (hash: string) =>
	buildKey(Entities.WITHDRAWAL_SUCCESS, hash);
