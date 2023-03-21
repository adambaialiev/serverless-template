import { buildTransactionKey, buildUserKey } from '@/common/dynamo/buildKey';
import {
	TableKeys,
	TransactionAttributes,
	TransactionItem,
} from '@/common/dynamo/schema';
import { withAuthorization } from '@/middlewares/withAuthorization';
import UserService from '@/services/user/user';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayEvent } from 'aws-lambda';
import { TransactionService } from '@/services/transaction/transactionService';
import AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export const handler = async (event: APIGatewayEvent) => {
	const userService = new UserService();
	try {
		const { phoneNumber } = JSON.parse(event.body as string);
		const user = await userService.getUser(phoneNumber);
		if (user.balance) {
			return sendResponse(201, 'balance should be zero');
		}
		const transactionsService = new TransactionService();

		const transactions = await transactionsService.getTransactions(phoneNumber);

		let itemsToDelete: {
			Delete: { TableName: string; Key: { PK: string; SK: string } };
		}[] = [];

		if (transactions.Items) {
			const transactionItems = transactions.Items as TransactionItem[];
			itemsToDelete = transactionItems.map((item) => ({
				Delete: {
					TableName,
					Key: {
						[TableKeys.PK]: buildUserKey(phoneNumber),
						[TableKeys.SK]: buildTransactionKey(item[TransactionAttributes.ID]),
					},
				},
			}));
		}
		itemsToDelete.push({
			Delete: {
				TableName,
				Key: {
					[TableKeys.PK]: buildUserKey(phoneNumber),
					[TableKeys.SK]: buildUserKey(phoneNumber),
				},
			},
		});

		await dynamo.transactWrite({ TransactItems: itemsToDelete }).promise();
		return sendResponse(201, true);
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return sendResponse(500, { message: error.message });
		}
	}
};

export const deleteAccount = withAuthorization(handler);
