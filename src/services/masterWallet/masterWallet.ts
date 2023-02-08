import {
	buildMasterWalletTransactionKey,
	buildTransactionKey,
	buildUserKey,
} from '@/common/dynamo/buildKey';
import {
	Entities,
	MasterWalletItem,
	MasterWalletTransactionAttributes,
	MasterWalletTransactionItem,
	TableKeys,
	UserItem,
} from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';
import { unmarshallUser } from '@/services/user/unmarshall';
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export interface IMasterWallet {
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
				privateKey: masterWallet.privateKey,
				publicAddress: masterWallet.publicAddress,
			};
		}
		return undefined;
	}

	async touchUserWallet(address: string, phoneNumber: string) {
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
			[MasterWalletTransactionAttributes.USER_PHONE_NUMBER]: phoneNumber,
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
				[TableKeys.PK]: Entities.MASTER_WALLET_TRANSACTION,
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

	async masterWalletHomeTransactionSuccess(transactionHash: string) {
		await dynamo.update({
			TableName,
			Key: {
				[TableKeys.PK]: Entities.MASTER_WALLET_TRANSACTION,
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

	async moveFundsToMasterWallet(amount: string, touchTransactionHash: string) {
		const masterWalletTransactionItem = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.MASTER_WALLET_TRANSACTION,
					[TableKeys.SK]: buildMasterWalletTransactionKey(touchTransactionHash),
				},
			})
			.promise();
		if (!masterWalletTransactionItem.Item) {
			throw new Error(
				`Can not find master wallet transaction with hash: ${touchTransactionHash}`
			);
		}
		const masterWalletTransaction =
			masterWalletTransactionItem.Item as MasterWalletTransactionItem;
		const crypto = new CryptoService();
		const userKey = buildUserKey(masterWalletTransaction.userPhoneNumber);
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
						[TableKeys.PK]: Entities.MASTER_WALLET_TRANSACTION,
						[TableKeys.SK]: buildMasterWalletTransactionKey(transactionHash),
						[MasterWalletTransactionAttributes.ID]: transactionHash,
						[MasterWalletTransactionAttributes.AMOUNT]: amount,
						[MasterWalletTransactionAttributes.FROM]: polygonWallet.publicKey,
						[MasterWalletTransactionAttributes.NETWORK]: 'polygon',
						[MasterWalletTransactionAttributes.STATUS]: 'pending',
						[MasterWalletTransactionAttributes.TO]: masterWallet.publicAddress,
						[MasterWalletTransactionAttributes.TYPE]: 'home',
					};
					await dynamo
						.transactWrite({
							TransactItems: [
								{
									Put: {
										Item,
										TableName,
										ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
									},
								},
								{
									Update: {
										TableName,
										Key: {
											[TableKeys.PK]: Entities.MASTER_WALLET_TRANSACTION,
											[TableKeys.SK]:
												buildMasterWalletTransactionKey(touchTransactionHash),
										},
										UpdateExpression: `SET #status = :status`,
										ExpressionAttributeNames: {
											'#status': 'status',
										},
										ExpressionAttributeValues: {
											':status': 'success',
										},
									},
								},
							],
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
