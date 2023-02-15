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
	wallets: IWallet[];
}

export interface UserSlug {
	phoneNumber: string;
	firstName: string;
	lastName: string;
	id: string;
	balance: string;
	pushToken: string;
}

export interface IUpdateUserParams {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
}
