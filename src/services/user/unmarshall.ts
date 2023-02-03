import { UserItem } from '@/common/dynamo/schema';
import { UserSlug } from '@/services/user/types';

export const unmarshallUserSlug = (userItem: UserItem): UserSlug => ({
	phoneNumber: userItem.phoneNumber,
	firstName: userItem.firstName,
	lastName: userItem.lastName,
	id: userItem.id,
	balance: userItem.balance,
	pushToken: userItem.pushToken,
});
