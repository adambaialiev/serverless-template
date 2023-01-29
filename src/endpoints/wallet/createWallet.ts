import { IWallet, UserAttributes } from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { CryptoWeb3Service } from '@/services/crypto/crypto-web3';
import { getUserCompositeKey } from '@/services/auth/auth2';
import { sendResponse } from '@/utils/makeResponse';
import { withAuthorization } from '@/middlewares/withAuthorization';

const cryptoService = new CryptoWeb3Service();
const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { phoneNumber } = JSON.parse(event.body);

		const { privateKey, address } = cryptoService.createCryptoWallet();

		const wallet: IWallet = {
			privateKey: privateKey,
			publicKey: address,
			chain: 'mainnet',
			network: 'erc20',
		};

		const params = {
			TableName,
			Key: getUserCompositeKey(phoneNumber),
			UpdateExpression: `SET #wallets = :wallets`,
			ExpressionAttributeNames: {
				'#wallets': UserAttributes.WALLETS,
			},
			ExpressionAttributeValues: {
				':wallets': [wallet],
			},
		};

		await dynamo.update(params).promise();

		callback(null, {
			statusCode: 201,
			body: JSON.stringify(true),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const createWallet = withAuthorization(handler);
