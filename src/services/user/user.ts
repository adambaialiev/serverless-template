import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys, UserItem } from '@/common/dynamo/schema';
import { IWallet, User, UserSlug } from '@/services/user/types';
import { unmarshallUser, unmarshallUserSlug } from '@/services/user/unmarshall';
import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export default class UserService {
	async getSlug(phoneNumber: string): Promise<UserSlug | undefined> {
		const tableName = process.env.dynamo_table as string;
		const userKey = buildUserKey(phoneNumber);
		const userOutput = await dynamoDB
			.get({
				TableName: tableName,
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
		const tableName = process.env.dynamo_table as string;
		const userKey = buildUserKey(phoneNumber);
		const userOutput = await dynamoDB
			.get({
				TableName: tableName,
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

	async getUserPolygonWallet(
		phoneNumber: string
	): Promise<IWallet | undefined> {
		const user = await this.getUser(phoneNumber);
		if (user) {
			return user.wallets.find((w) => w.network === 'polygon');
		}
	}
}
