import { buildFeedbackKey, buildUserKey } from '@/common/dynamo/buildKey';
import {
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
		const feedbackId = v4();
		const feedbackKey = buildFeedbackKey(feedbackId);

		const Item = {
			[TableKeys.PK]: buildUserKey(user.phoneNumber),
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
