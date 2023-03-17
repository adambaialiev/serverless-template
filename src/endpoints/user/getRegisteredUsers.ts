import AWS from 'aws-sdk';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import { removeAllSpaces } from '@/utils/removeAllSpaces';
import { addCountryCodeToNumber } from '@/utils/addCountryCodeToNumber';
import { batchRequestedItems } from '@/utils/batchRequestedItems';
import { TransactionService } from '@/services/transaction/transactionService';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const transactionService = new TransactionService();
const tableName = process.env.dynamo_table as string;

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway
) => {
	try {
		const { phoneNumbers, countryCode } = JSON.parse(event.body as string);

		const sourceUsersPhoneNumber = event.user.phoneNumber;

		const newPhoneNumbers = phoneNumbers
			.map((number: string) => removeAllSpaces(number))
			.map((el: string) => addCountryCodeToNumber(el, countryCode));

		const batches = batchRequestedItems(
			Array.from(new Set([...newPhoneNumbers])),
			100
		);
		const results = [];

		for (const keysBatch of batches) {
			let Keys: any = keysBatch.map((item) => ({
				PK: `USER#${item}`,
				SK: `USER#${item}`,
			}));
			do {
				const response = await dynamoDB
					.batchGet({
						RequestItems: {
							[tableName]: { Keys },
						},
					})
					.promise();
				results.push(...response.Responses[tableName]);
				Keys = response.UnprocessedKeys[tableName] ?? [];
			} while (Keys.length > 0);
		}

		const numbersDictionary: Record<string, any> = {};

		for (const number of phoneNumbers) {
			const number1 = removeAllSpaces(number);
			const number2 = addCountryCodeToNumber(number1, countryCode);
			if (results.map((item) => item.phoneNumber).includes(number2)) {
				const transactions = await transactionService.getTransactionsRoom(
					sourceUsersPhoneNumber,
					number2
				);
				const unreadTransactionsCount = transactions.filter(
					(item) => item.isRead !== undefined && !item.isRead
				);
				const targetUser = results.find((item) => item.phoneNumber === number2);
				numbersDictionary[number] = {
					registered: true,
					internationalNumber: number2,
					unreadTransactions: unreadTransactionsCount.length,
					avatar: targetUser.avatar,
				};
			} else {
				numbersDictionary[number] = {
					registered: false,
					internationalNumber: number2,
				};
			}
		}

		return sendResponse(200, { items: numbersDictionary });
	} catch (error) {
		console.log(error);
		const message = error.message ? error.message : 'Internal server error';
		return sendResponse(500, { message });
	}
};

export const getRegisteredUsers = withAuthorization(handler);
