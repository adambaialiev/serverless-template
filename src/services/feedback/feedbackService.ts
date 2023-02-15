import { buildFeedbackKey } from '@/common/dynamo/buildKey';
import {
	Entities,
	FeedbackAttributes,
	UserItem,
	TableKeys,
} from '@/common/dynamo/schema';
import AWS from 'aws-sdk';
import { v4 } from 'uuid';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

export class FeedbackService {
	async create(user: UserItem, comment: string | undefined, rating: number) {
		const feedbackKey = buildFeedbackKey(v4());
		const feedbackId = v4();
		console.log('user', JSON.stringify(user, null, 2));

		const Item = {
			[TableKeys.PK]: Entities.FEEDBACK,
			[TableKeys.SK]: feedbackKey,
			[FeedbackAttributes.ID]: feedbackId,
			[FeedbackAttributes.COMMENT]: comment ?? '',
			[FeedbackAttributes.RATING]: rating,
			[FeedbackAttributes.USER]: user.id,
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
