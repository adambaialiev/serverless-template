import { Entities } from "./schema";

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;

export const buildUserKey = (phoneNumber: string) =>
  buildKey(Entities.USER, phoneNumber);

export const buildTransactionKey = (id: string) =>
  buildKey(Entities.TRANSACTION, id);
