import {
	CustomAPIGateway,
	withAuthorization,
} from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import { getUserCompositeKey } from '@/services/auth/auth';
import { IWithdrawalAddress, UserAttributes } from '@/common/dynamo/schema';
import { v4 } from 'uuid';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway
) => {
	try {
		const { address, name, network } = JSON.parse(
			event.body
		) as IWithdrawalAddress;
		const user = event.user;

		if (!address || !name || !network) {
			throw new Error('Missing body params');
		}

		const newAddress = {
			name,
			address,
			network,
			id: v4(),
		};

		const updatedUser = await dynamoDB
			.update({
				TableName,
				Key: getUserCompositeKey(user.phoneNumber),
				UpdateExpression:
					'SET #withdrawalAddresses = list_append(if_not_exists(#withdrawalAddresses, :emptyList), :address)',
				ExpressionAttributeNames: {
					'#withdrawalAddresses': UserAttributes.WITHDRAWAL_ADDRESSES,
				},
				ExpressionAttributeValues: {
					':emptyList': [],
					':address': [newAddress],
				},
				ReturnValues: 'UPDATED_NEW',
			})
			.promise();

		return sendResponse(200, updatedUser.Attributes);
	} catch (error: unknown) {
		console.error({ error });
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const addWithdrawalAddress = withAuthorization(handler);
