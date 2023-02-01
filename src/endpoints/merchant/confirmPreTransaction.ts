import { buildPreTransactionKey, buildUserKey } from '@/common/dynamo/buildKey';
import { sendResponse } from '@/utils/makeResponse';
import BalanceService from '@/services/balance/balance';
import { APIGatewayEvent } from 'aws-lambda';
import UserService from '@/services/user/user';

import AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;
const balanceService = new BalanceService();
const userService = new UserService();

const deletePreTransactions = ({ PK, SK }: any) => {
	return dynamoDB.delete({ TableName, Key: { PK, SK } }).promise();
};

export const ConfirmPreTransaction = async (event: APIGatewayEvent) => {
	try {
		const { status, source } = JSON.parse(event.body as string);
		const preTransactionKey = buildPreTransactionKey(source);
		const userKey = buildUserKey(source);
		const params = {
			TableName,
			FilterExpression: 'PK = :pk and SK = :sk',
			ExpressionAttributeValues: {
				':sk': preTransactionKey,
				':pk': userKey,
			},
		};
		const transactionOutput = await dynamoDB.scan(params).promise();
		const preTransaction = transactionOutput.Items[0];
		if (preTransaction.type !== 'out') {
			return sendResponse(200, { message: 'pre transactions doesnt exists' });
		}
		const { target, amount } = preTransaction;
		const sourceSlug = await userService.getSlug(source);
		const targetSlug = await userService.getSlug(target);
		const targetKey = buildUserKey(target);
		const targetTransactionKey = buildPreTransactionKey(target);
		const balanceOutput = await balanceService.makeTransaction(
			sourceSlug,
			targetSlug,
			amount
		);

		if (balanceOutput) {
			await deletePreTransactions({ PK: userKey, SK: preTransactionKey });
			await deletePreTransactions({ PK: targetKey, SK: targetTransactionKey });
		}

		return sendResponse(200, { message: balanceOutput, status });
	} catch (error) {
		console.log(error);
		return sendResponse(200, { message: error.message });
	}
};
