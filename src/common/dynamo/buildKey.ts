import { Entities } from '@/common/dynamo/schema';

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
	buildKey(Entities.USER, phoneNumber);

export const buildMerchantKey = (phonNumber: string) =>
	buildKey(Entities.MERCHANT, phonNumber);

export const buildApiKey = (api: string) => buildKey(Entities.API, api);

export const buildTransactionKey = (id: string) =>
	buildKey(Entities.TRANSACTION, id);

export const buildPreTransactionKey = (id: string) =>
	buildKey(Entities.PRE_TRANSACTION, id);

export const buildIncrementTransactionKey = (hash: string) =>
	buildKey(Entities.INCREMENT_TRANSACTION, hash);
