import AWS from 'aws-sdk';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { countries } from 'countries-list';
import { withAuthorization } from '@/middlewares/withAuthorization';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.dynamo_table as string;

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { phoneNumbers, countryCode } = JSON.parse(event.body as string);

		const newPhoneNumbers = phoneNumbers
			.map((number: string) =>
				number.replace(/\(|\)|-/g, '').replace(/\s/g, '')
			)
			.map((el: string) =>
				(el.startsWith('+')
					? el
					: '+' +
					  countries[countryCode as keyof typeof countries].phone +
					  el.replace(/^./, '')
				).replace(/[- ]/g, '')
			);

		const params = {
			RequestItems: {
				[tableName]: {
					Keys: newPhoneNumbers.map((item: string) => ({
						PK: `USER#${item}`,
						SK: `USER#${item}`,
					})),
				},
			},
		};
		const usersPhoneNumbersOutput = (
			await dynamoDB.batchGet(params).promise()
		).Responses[tableName].map((item) => item.phoneNumber);

		const numbersDictionary: Record<string, any> = {};

		for (const number of phoneNumbers) {
			const number1 = number.replace(/\(|\)|-/g, '').replace(/\s/g, '');
			const number2 = (
				number1.startsWith('+')
					? number1
					: '+' +
					  countries[countryCode as keyof typeof countries].phone +
					  number1.replace(/^0+/, '')
			).replace(/[- ]/g, '');

			if (usersPhoneNumbersOutput.includes(number2)) {
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

		callback(null, {
			statusCode: 200,
			body: JSON.stringify(numbersDictionary),
		});
	} catch (error) {
		console.log(error);
		const message = error.message ? error.message : 'Internal server error';
		return sendResponse(500, { message });
	}
};

export const getRegisteredUsers = withAuthorization(handler);
