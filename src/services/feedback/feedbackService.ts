import { buildFeedbackKey } from '@/common/dynamo/buildKey';
import {
	FeedbackAttributes,
	UserItem,
	TableKeys,
	Entities,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export class FeedbackService {
	async create(user: UserItem, comment: string | undefined, rating: number) {
		const id = v4();

		const date = Date.now().toString();

		const Item = {
			[TableKeys.PK]: Entities.FEEDBACK,
			[TableKeys.SK]: buildFeedbackKey(id),
			[FeedbackAttributes.ID]: id,
			[FeedbackAttributes.COMMENT]: comment ?? '',
			[FeedbackAttributes.RATING]: rating,
			[FeedbackAttributes.USER]: user.id,
			[FeedbackAttributes.CREATED_AT]: date,
			[FeedbackAttributes.UPDATED_AT]: date,
		};

		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		return 'Success';
	}
}
