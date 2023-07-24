import buildContractTypeQuery from '../queryBuilders/contractType';
import { GraphQLClient } from 'graphql-request';

const endpoint = 'https://graphql.bitquery.io';

export interface Address {
	address: string;
	balance: number;
	smartContract: { contractType: string } | null;
}

interface AddressData {
	ethereum: {
		address: Address[];
	};
}

export interface WalletToType {
	[key: string]: Address;
}

export default async function getWalletsToType(wallets: string[]) {
	const client = new GraphQLClient(endpoint, {
		headers: {
			'X-API-KEY': 'BQYQVe7TwMsIG9LFCgphkTff6in7kr2w',
		},
	});
	const walletToType: WalletToType = {};
	for (let i = 0; i < wallets.length; i++) {
		const wallet = wallets[i];
		try {
			const result = (await client.request(
				buildContractTypeQuery(wallet)
			)) as any;
			const addressData = result as AddressData;
			const address = addressData.ethereum.address[0];
			if (address) {
				walletToType[wallet] = address;
			}
		} catch (error) {
			console.log({ error });
		}
	}
	return walletToType;
}
