import { buildUserKey } from '@/common/dynamo/buildKey';
import { TableKeys, UserItem, UserAttributes } from '@/common/dynamo/schema';
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
		};

		await dynamoDB.update(params).promise();
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
