import { Entities } from '@/common/dynamo/schema';

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
	buildKey(Entities.USER, phoneNumber);

export const buildUserWalletKey = (address: string) =>
	buildKey(Entities.USER_WALLET, address);

export const buildTransactionKey = (id: string) =>
	buildKey(Entities.TRANSACTION, id);

export const buildFeedbackKey = (id: string) => buildKey(Entities.FEEDBACK, id);
export const buildTransactionRequestKey = (id: string) =>
	buildKey(Entities.TRANSACTION_REQUEST, id);

export const buildIncrementTransactionKey = (hash: string) =>
	buildKey(Entities.INCREMENT_TRANSACTION, hash);

export const buildDecrementTransactionKey = (hash: string) =>
	buildKey(Entities.DECREMENT_TRANSACTION, hash);

export const buildWithdrawToProcessKey = (hash: string) =>
	buildKey(Entities.WITHDRAW_TO_PROCESS, hash);
