import {
	DefineAuthChallengeTriggerEvent,
	DefineAuthChallengeTriggerHandler,
} from 'aws-lambda';

export const defineAuthChallenge: DefineAuthChallengeTriggerHandler = async (
	event: DefineAuthChallengeTriggerEvent
) => {
	console.log('RECEIVED event: ', JSON.stringify(event, null, 2));

	if (event.request.userNotFound) {
		console.log('User does not exist');
		event.response.issueTokens = false;
		event.response.failAuthentication = true;
		throw new Error('User does not exist');
	}

	if (
		event.request.session &&
		event.request.session.length &&
		event.request.session.slice(-1)[0].challengeName === 'SRP_A'
	) {
		event.request.session = [];
		event.response.issueTokens = false;
		event.response.failAuthentication = false;
		event.response.challengeName = 'CUSTOM_CHALLENGE';
	} else if (
		event.request.session &&
		event.request.session.length &&
		event.request.session.slice(-1)[0].challengeName === 'CUSTOM_CHALLENGE' &&
		event.request.session.slice(-1)[0].challengeResult
	) {
		console.log('The user provided the right answer to the challenge');
		event.response.issueTokens = true;
		event.response.failAuthentication = false;
	} else if (
		event.request.session &&
		event.request.session.length >= 3 &&
		!event.request.session.slice(-1)[0].challengeResult
	) {
		console.log(
			'FAILED Authentication: The user provided a wrong answer 3 times'
		);
		event.response.issueTokens = false;
		event.response.failAuthentication = true;
		throw new Error('Invalid OTP');
	} else {
		event.response.issueTokens = false;
		event.response.failAuthentication = false;
		event.response.challengeName = 'CUSTOM_CHALLENGE';
	}

	console.log('RETURNED event: ', JSON.stringify(event, null, 2));

	return event;
};
