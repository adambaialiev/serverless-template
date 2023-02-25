import { buildUserKey, buildUserWalletKey } from '@/common/dynamo/buildKey';
import {
	Entities,
	IndexNames,
	TableKeys,
	UserAttributes,
	UserItem,
	UserWalletAttributes,
	UserWalletItem,
} from '@/common/dynamo/schema';
import {
	IUpdateUserParams,
	IWallet,
	User,
	UserSlug,
} from '@/services/user/types';
import { unmarshallUser, unmarshallUserSlug } from '@/services/user/unmarshall';
import AWS from 'aws-sdk';
import { getUserCompositeKey } from '../auth/auth';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export default class UserService {
	async getSlug(phoneNumber: string): Promise<UserSlug | undefined> {
		const userKey = buildUserKey(phoneNumber);
		const userOutput = await dynamoDB
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: userKey,
					[TableKeys.SK]: userKey,
				},
			})
			.promise();

		if (userOutput.Item) {
			return unmarshallUserSlug(userOutput.Item as UserItem);
		}
		return undefined;
	}

	async getUser(phoneNumber: string): Promise<User | undefined> {
		const userKey = buildUserKey(phoneNumber);
		const userOutput = await dynamoDB
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: userKey,
					[TableKeys.SK]: userKey,
				},
			})
			.promise();

		if (userOutput.Item) {
			return unmarshallUser(userOutput.Item as UserItem);
		}
		return undefined;
	}

	async update({ email, firstName, lastName, phoneNumber }: IUpdateUserParams) {
		const params = {
			TableName,
			Key: getUserCompositeKey(phoneNumber),
			UpdateExpression: `SET #firstName = :firstName, #lastName = :lastName, #email = :email, #updatedAt = :updatedAt`,
			ExpressionAttributeNames: {
				'#firstName': UserAttributes.FIRST_NAME,
				'#lastName': UserAttributes.LAST_NAME,
				'#email': UserAttributes.EMAIL,
				'#updatedAt': UserAttributes.UPDATED_AT,
			},
			ExpressionAttributeValues: {
				':firstName': firstName ?? '',
				':lastName': lastName ?? '',
				':email': email ?? '',
				':updatedAt': Date.now().toString(),
			},
			ReturnValues: 'ALL_NEW',
		};

		return (await dynamoDB.update(params).promise()).Attributes;
	}

	async getUserPolygonWallet(
		phoneNumber: string
	): Promise<IWallet | undefined> {
		const user = await this.getUser(phoneNumber);
		if (user) {
			return user.wallets.find((w) => w.network === 'polygon');
		}
	}

	async getUserPhoneNumberByWalletAddress(address: string) {
		const output = await dynamoDB
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.USER_WALLET,
					[TableKeys.SK]: buildUserWalletKey(address),
				},
			})
			.promise();
		if (output.Item) {
			const user = output.Item as UserItem;
			return user.phoneNumber;
		}
	}

	async getPoolBalanceAndUsersList() {
		const output = await dynamoDB
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
			let poolBalance = 0;
			const usersList: {
				phoneNumber: string;
				balance: string;
				createdAt: string;
			}[] = [];
			for (const user of users) {
				poolBalance += Number(user.balance);
				usersList.push({
					phoneNumber: user.phoneNumber,
					balance: user.balance,
					createdAt: user.createdAt,
				});
			}
			return { poolBalance, usersList };
		}
	}

	async getAllWallets() {
		const output = await dynamoDB
			.query({
				TableName,
				KeyConditionExpression: `#pk = :pk`,
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.USER_WALLET,
				},
			})
			.promise();
		if (output.Items) {
			const userWalletItems = output.Items as UserWalletItem[];
			return userWalletItems.reduce((acc, item) => {
				acc[item[UserWalletAttributes.ADDRESS].toLowerCase()] = item;
				return acc;
			}, {} as { [key: string]: UserWalletItem });
		}
	}

	async getUsersForAdmin(): Promise<User[] | undefined> {
		const output = await dynamoDB
			.query({
				TableName: process.env.dynamo_table as string,
				IndexName: IndexNames.GSI1,
				KeyConditionExpression: '#pk = :pk',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.USER,
				},
			})
			.promise();
		if (output.Items) {
			return output.Items.map((item) => unmarshallUser(item as UserItem));
		}
	}
}
