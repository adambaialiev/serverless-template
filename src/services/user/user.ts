import { buildUserKey } from '@/common/dynamo/buildKey';
import {
	Entities,
	IndexNames,
	TableKeys,
	UserAttributes,
	UserItem,
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
