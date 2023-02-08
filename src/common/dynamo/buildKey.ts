import { Entities } from '@/common/dynamo/schema';

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
	buildKey(Entities.USER, phoneNumber);

export const buildTransactionKey = (id: string) =>
	buildKey(Entities.TRANSACTION, id);

export const buildIncrementTransactionKey = (hash: string) =>
	buildKey(Entities.INCREMENT_TRANSACTION, hash);

export const buildMasterWalletTransactionKey = (hash: string) =>
	buildKey(Entities.MASTER_WALLET_TRANSACTION, hash);
