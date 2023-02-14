import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import {
	Entities,
	IndexNames,
	TableKeys,
	UserItem,
} from '@/common/dynamo/schema';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IWallet } from '@/services/user/types';

const dynamoDb = new DocumentClient();

export const handler = async (
	event: APIGatewayEvent,
	context: Context,
	callback: APIGatewayProxyCallback
) => {
	try {
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
			callback(null, {
				statusCode: 201,
				body: JSON.stringify(addresses),
			});
		} else {
			return {
				statusCode: 500,
				body: 'no users',
			};
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return {
				statusCode: 500,
				body: error.message,
			};
		}
	}
};

export const usersWalletAddresses = handler;
