import { UserItem } from '@/common/dynamo/schema';
import { User, UserSlug } from '@/services/user/types';

export const unmarshallUserSlug = (userItem: UserItem): UserSlug => ({
	phoneNumber: userItem.phoneNumber,
	firstName: userItem.firstName,
	lastName: userItem.lastName,
	id: userItem.id,
	balance: userItem.balance,
	pushToken: userItem.pushToken,
	unreadNotifications: Number(userItem.unreadNotifications),
});

export const unmarshallUser = (userItem: UserItem): User => ({
	phoneNumber: userItem.phoneNumber,
	firstName: userItem.firstName,
	lastName: userItem.lastName,
	createdAt: userItem.createdAt,
	updatedAt: userItem.updatedAt,
	balance: Number(userItem.balance),
	wallets: userItem.wallets,
});
