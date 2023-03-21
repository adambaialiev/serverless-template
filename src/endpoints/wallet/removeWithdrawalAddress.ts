import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import { getUserCompositeKey } from '@/services/auth/auth';
import { UserAttributes } from '@/common/dynamo/schema';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway
) => {
	try {
		const { id } = event.pathParameters;
		const user = event.user;

		if (!id) {
			throw new Error('Missing path parameter');
		}

		const targetAddressIndex = user.withdrawalAddresses.findIndex(
			(item) => item.id === id
		);

		const updatedOutput = await dynamoDB
			.update({
				TableName,
				Key: getUserCompositeKey(user.phoneNumber),
				UpdateExpression: `REMOVE #list[${targetAddressIndex}]`,
				ExpressionAttributeNames: {
					'#list': UserAttributes.WITHDRAWAL_ADDRESSES,
				},
				ReturnValues: 'ALL_NEW',
			})
			.promise();

		return sendResponse(200, updatedOutput.Attributes);
	} catch (error: unknown) {
		console.error({ error });
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const removeWithdrawalAddress = withAuthorization(handler);
