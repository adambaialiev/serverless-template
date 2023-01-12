import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';

export const preSignUp: PreSignUpTriggerHandler = async (
	event: PreSignUpTriggerEvent
) => {
	console.log('Received EVENT', JSON.stringify(event, null, 2));

	// const phoneNumber = event.request.userAttributes.phone_number;

	// const userKey = buildUserKey(phoneNumber);

	// const params = {
	//   [TableKeys.PK]: userKey,
	//   [TableKeys.SK]: userKey,
	//   [UserAttributes.FIRST_NAME]: '',
	//   [UserAttributes.LAST_NAME]: '',
	//   [UserAttributes.BALANCE]: 100,
	//   [UserAttributes.PHONE_NUMBER]: phoneNumber,
	//   [UserAttributes.CREATED_AT]: Date.now().toString(),
	//   [UserAttributes.UPDATED_AT]: '',
	//   [UserAttributes.EMAIL]: '',
	// };
	// await dynamoDB.putItem(process.env.dynamo_table as string, params);

	event.response.autoConfirmUser = true;
	event.response.autoVerifyPhone = true;
	return event;
};
