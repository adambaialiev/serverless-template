import { buildTransactionKey, buildUserKey } from '@/common/dynamo/buildKey';
import {
	Entities,
	MasterWalletAttributes,
	MasterWalletItem,
	MasterWalletTransactionAttributes,
	TableKeys,
	UserItem,
} from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import { unmarshallUser } from '@/services/user/unmarshall';
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export interface IMasterWallet {
	balance: string;
	publicAddress: string;
	privateKey: string;
}

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

	async getMasterWallet(): Promise<IMasterWallet | undefined> {
		const masterWalletOutput = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.MASTER_WALLET,
					[TableKeys.SK]: Entities.MASTER_WALLET,
				},
			})
			.promise();
		if (masterWalletOutput.Item) {
			const masterWallet = masterWalletOutput.Item as MasterWalletItem;
			return {
				balance: masterWallet[MasterWalletAttributes.BALANCE],
				privateKey: masterWallet.privateKey,
				publicAddress: masterWallet.publicAddress,
			};
		}
		return undefined;
	}

	async touchUserWallet(address: string) {
		const crypto = new CryptoService();
		const masterWalletService = new MasterWallet();
		const masterWallet = await masterWalletService.getMasterWallet();
		const amount = '0.01';
		const transactionHash = await crypto.sendMaticToAddress(address, amount);
		const Item = {
			[TableKeys.PK]: Entities.MASTER_WALLET_TRANSACTION,
			[TableKeys.SK]: buildTransactionKey(transactionHash),
			[MasterWalletTransactionAttributes.ID]: transactionHash,
			[MasterWalletTransactionAttributes.AMOUNT]: amount,
			[MasterWalletTransactionAttributes.FROM]: masterWallet.publicAddress,
			[MasterWalletTransactionAttributes.NETWORK]: 'polygon',
			[MasterWalletTransactionAttributes.STATUS]: 'pending',
			[MasterWalletTransactionAttributes.TO]: address,
			[MasterWalletTransactionAttributes.TYPE]: 'touch',
		};
		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();
	}

	async updateUserWalletTouchToSuccess(transactionHash: string) {
		await dynamo.update({
			TableName,
			Key: {
				[TableKeys.PK]: buildTransactionKey(transactionHash),
				[TableKeys.SK]: buildTransactionKey(transactionHash),
			},
			UpdateExpression: `SET #status = :status`,
			ExpressionAttributeNames: {
				'#status': 'status',
			},
			ExpressionAttributeValues: {
				':status': 'success',
			},
		});
	}

	async moveFundsToMasterWallet(phoneNumber: string, amount: string) {
		const crypto = new CryptoService();
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
					const masterWalletService = new MasterWallet();
					const masterWallet = await masterWalletService.getMasterWallet();
					const transactionHash =
						await crypto.makePolygonUsdtTransactionToMasterWallet(
							polygonWallet.privateKey,
							polygonWallet.publicKey,
							amount
						);
					const Item = {
						[TableKeys.PK]: buildTransactionKey(transactionHash),
						[TableKeys.SK]: buildTransactionKey(transactionHash),
						[MasterWalletTransactionAttributes.ID]: transactionHash,
						[MasterWalletTransactionAttributes.AMOUNT]: amount,
						[MasterWalletTransactionAttributes.FROM]: polygonWallet.publicKey,
						[MasterWalletTransactionAttributes.NETWORK]: 'polygon',
						[MasterWalletTransactionAttributes.STATUS]: 'pending',
						[MasterWalletTransactionAttributes.TO]: masterWallet.publicAddress,
						[MasterWalletTransactionAttributes.TYPE]: 'touch',
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
		}
	}

	async withdraw() {
		//
	}
}
