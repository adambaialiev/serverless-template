import { buildApiKey, buildMerchantKey } from '@/common/dynamo/buildKey';
import { Entities, TableKeys } from '@/common/dynamo/schema';
import AWS from 'aws-sdk';

interface ApiKeyProps {
	phoneNumber: string;
	key: string;
}

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TableName = process.env.dynamo_table as string;

export class ApiKey {
	async CreateApiKey({ phoneNumber, key }: ApiKeyProps) {
		const merchantKey = buildMerchantKey(phoneNumber);
		const apiKey = buildApiKey(key);
		const Item = {
			[TableKeys.PK]: merchantKey,
			[TableKeys.SK]: apiKey,
		};
		const params = {
			TableName,
			Item,
		};
		const output = await dynamoDB.put(params).promise();
		return output;
	}

	async GetApiKey(phoneNumber: string) {
		const merchantKey = buildMerchantKey(phoneNumber);
		const params = {
			TableName,
			FilterExpression: 'PK = :pk and begins_with(SK, :sk)',
			ExpressionAttributeValues: {
				':sk': Entities.API,
				':pk': merchantKey,
			},
		};
		const output = await dynamoDB.scan(params).promise();
		return output;
	}
}
