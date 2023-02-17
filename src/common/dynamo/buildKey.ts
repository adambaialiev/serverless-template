import { Entities } from '@/common/dynamo/schema';

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
	buildKey(Entities.USER, phoneNumber);

export const buildTransactionKey = (id: string) =>
	buildKey(Entities.TRANSACTION, id);

export const buildIncrementTransactionKey = (hash: string) =>
	buildKey(Entities.INCREMENT_TRANSACTION, hash);

export const buildDecrementTransactionKey = (hash: string) =>
	buildKey(Entities.DECREMENT_TRANSACTION, hash);

export const buildWithdrawalToProcessKey = (hash: string) =>
	buildKey(Entities.WITHDRAWAL_TO_PROCESS, hash);
