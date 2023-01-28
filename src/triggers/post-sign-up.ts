import { buildUserKey } from '@/common/dynamo/buildKey';
import { DynamoMainTable } from '@/common/dynamo/DynamoMainTable';
import { TableKeys, UserAttributes } from '@/common/dynamo/schema';
import {
	PostConfirmationTriggerEvent,
	PostConfirmationTriggerHandler,
} from 'aws-lambda';

const dynamoDB = new DynamoMainTable();

export const postSignUp: PostConfirmationTriggerHandler = async (
	event: PostConfirmationTriggerEvent
) => {
	const phoneNumber = event.request.userAttributes.phone_number;
	const userKey = buildUserKey(phoneNumber);
	const params = {
		[TableKeys.PK]: userKey,
		[TableKeys.SK]: userKey,
		[UserAttributes.FIRST_NAME]: '',
		[UserAttributes.LAST_NAME]: '',
		[UserAttributes.BALANCE]: 100,
		[UserAttributes.PHONE_NUMBER]: phoneNumber,
		[UserAttributes.CREATED_AT]: Date.now().toString(),
		[UserAttributes.UPDATED_AT]: '',
		[UserAttributes.EMAIL]: '',
	};
	await dynamoDB.putItem(params);

	return event;
};
