import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';

export const preSignUp: PreSignUpTriggerHandler = async (
	event: PreSignUpTriggerEvent
) => {
	console.log('Received EVENT', JSON.stringify(event, null, 2));

	event.response.autoConfirmUser = true;
	event.response.autoVerifyPhone = true;
	return event;
};
