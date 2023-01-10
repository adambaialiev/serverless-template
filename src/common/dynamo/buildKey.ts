import { Entities } from "./schema";

export const buildKey = (entity: Entities, id: string) => `${entity}${id}`;
