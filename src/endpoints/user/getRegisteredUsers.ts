import AWS from 'aws-sdk';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { withAuthorization } from '@/middlewares/withAuthorization';
import { removeAllSpaces } from '@/utils/removeAllSpaces';
import { addCountryCodeToNumber } from '@/utils/addCountryCodeToNumber';
import { batchRequestedItems } from '@/utils/batchRequestedItems';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.dynamo_table as string;

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { phoneNumbers, countryCode } = JSON.parse(event.body as string);
		console.log('incomingPhoneNumbers>', JSON.stringify(phoneNumbers, null, 2));
		console.log('countryCode>', JSON.stringify(countryCode, null, 2));

		const newPhoneNumbers = phoneNumbers
			.map((number: string) => removeAllSpaces(number))
			.map((el: string) => addCountryCodeToNumber(el, countryCode));

		console.log('newPhoneNumbers>', JSON.stringify(newPhoneNumbers, null, 2));
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
		console.log('results>', JSON.stringify(results, null, 2));

		const numbersDictionary: Record<string, any> = {};
		console.log('results>', JSON.stringify(results, null, 2));

		for (const number of phoneNumbers) {
			const number1 = removeAllSpaces(number);
			const number2 = addCountryCodeToNumber(number1, countryCode);
			if (results.map((item) => item.phoneNumber).includes(number2)) {
				numbersDictionary[number] = {
					registered: true,
					internationalNumber: number2,
				};
			} else {
				numbersDictionary[number] = {
					registered: false,
					internationalNumber: number2,
				};
			}
		}

		console.log(
			'numbersDictionary>',
			JSON.stringify(numbersDictionary, null, 2)
		);
		callback(null, {
			statusCode: 200,
			body: JSON.stringify({
				items: numbersDictionary,
			}),
		});
	} catch (error) {
		console.log(error);
		const message = error.message ? error.message : 'Internal server error';
		return sendResponse(500, { message });
	}
};

export const getRegisteredUsers = withAuthorization(handler);
