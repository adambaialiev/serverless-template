import { IWithdrawalAddress } from '@/common/dynamo/schema';

export interface IWallet {
	publicKey: string;
	privateKey: string;
	network: 'erc20' | 'trc20' | 'polygon';
	chain: 'goerli' | 'mainnet';
	phoneNumber: string;
}

export interface User {
	phoneNumber: string;
	firstName: string;
	lastName: string;
	createdAt: string;
	updatedAt: string;
	balance: number;
	avatar: string;
	wallets: IWallet[];
	withdrawalAddresses: IWithdrawalAddress[];
}

export interface UserSlug {
	phoneNumber: string;
	firstName: string;
	lastName: string;
	id: string;
	balance: string;
	pushToken: string;
	unreadNotifications: number;
}

export interface IUpdateUserParams {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	avatar: string;
}
