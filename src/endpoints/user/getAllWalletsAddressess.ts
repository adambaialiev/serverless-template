import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { Entities, IWallet, TableKeys, UserItem } from '@/common/dynamo/schema';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

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
				KeyConditionExpression: 'begins_with(#pk, :pk)',
				ExpressionAttributeNames: {
					'#pk': TableKeys.PK,
				},
				ExpressionAttributeValues: {
					':pk': Entities.USER,
				},
			})
			.promise();

		if (output.Items) {
			const users = output.Items as UserItem[];
			const addresses: string[] = [];
			users.forEach((user) => {
				const wallets = user.wallets as IWallet[];
				wallets.forEach((wallet) => {
					if (wallet.network === 'erc20' && wallet.chain === 'mainnet') {
						addresses.push(wallet.publicKey);
					}
				});
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

export const getAllWalletsAddresses = handler;
