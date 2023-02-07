import { buildUserKey } from '@/common/dynamo/buildKey';
import { Entities, TableKeys, UserItem } from '@/common/dynamo/schema';
import { unmarshallUser } from '@/services/user/unmarshall';
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export default class MasterWallet {
	async createMasterWalletIfNeeded() {
		const mainWalletOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.MASTER_WALLET,
					[TableKeys.SK]: Entities.MASTER_WALLET,
				},
			})
			.promise();

		if (!mainWalletOutput.Item) {
			const Item = {
				[TableKeys.PK]: Entities.MASTER_WALLET,
				[TableKeys.SK]: Entities.MASTER_WALLET,
			};

			await dynamo
				.put({
					Item,
					TableName,
					ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
				})
				.promise();
		}
	}

	async touchUserWallet() {
		//
	}

	async moveFundsToMasterWallet(
		phoneNumber: string,
		amount: string,
		publicAddress: string
	) {
		const userKey = buildUserKey(phoneNumber);
		const userOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: userKey,
					[TableKeys.SK]: userKey,
				},
			})
			.promise();
		if (userOutput.Item) {
			const user = unmarshallUser(userOutput.Item as UserItem);
			if (user.wallets && user.wallets.length) {
				const polygonWallet = user.wallets.find((w) => w.network === 'polygon');
				if (polygonWallet) {
					//
				}
			}
		}
	}

	async withdraw() {
		//
	}
}
