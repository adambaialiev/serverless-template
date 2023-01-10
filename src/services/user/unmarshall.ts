import { UserItem } from "../../common/dynamo/schema";
import { UserSlug } from "./types";

export const unmarshallUserSlug = (userItem: UserItem): UserSlug => ({
  phoneNumber: userItem.phoneNumber,
  firstName: userItem.firstName,
  lastName: userItem.lastName,
  id: userItem.id,
});
