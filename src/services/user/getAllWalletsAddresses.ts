import {
	Entities,
	IndexNames,
	TableKeys,
	UserItem,
} from '@/common/dynamo/schema';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IWallet } from '@/services/user/types';

const dynamoDb = new DocumentClient();

export const getAllWalletsAddresses = async () => {
	const output = await dynamoDb
		.query({
			TableName: process.env.dynamo_table as string,
			KeyConditionExpression: '#pk = :pk',
			IndexName: IndexNames.GSI1,
			ExpressionAttributeNames: {
				'#pk': TableKeys.GSI1PK,
			},
			ExpressionAttributeValues: {
				':pk': Entities.USER,
			},
		})
		.promise();
	if (output.Items) {
		const users = output.Items as UserItem[];
		const addresses: { address: string; phoneNumber: string }[] = [];
		users.forEach((user) => {
			const wallets = user.wallets as IWallet[];
			if (wallets) {
				wallets.forEach((wallet) => {
					if (wallet.network === 'polygon' && wallet.chain === 'mainnet') {
						addresses.push({
							address: wallet.publicKey,
							phoneNumber: user.phoneNumber,
						});
					}
				});
			}
		});
		return addresses;
	}
};
