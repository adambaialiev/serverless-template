'use strict';
import { randomDigits } from 'crypto-secure-random-digit';
import AWS from 'aws-sdk';

const sendSMS = (phoneNumber: string, passCode: string) => {
  const params = {
    Message: 'Your secret code: ' + passCode,
    PhoneNumber: phoneNumber,
  };

  return new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
};

export const createAuthChallenge = async (event: any) => {
  console.log('RECEIVED event: ', JSON.stringify(event, null, 2));

  let passCode;
  const phoneNumber = event.request.userAttributes.phone_number;

  // The requests received from the mobile apps can contain "SRP_A"
  if (
    (event.request.session &&
      event.request.session.length &&
      event.request.session.slice(-1)[0].challengeName == 'SRP_A') ||
    event.request.session.length == 0
  ) {
    passCode = randomDigits(6).join('');
    await sendSMS(phoneNumber, passCode);
  } else {
    const previousChallenge = event.request.session.slice(-1)[0];
    passCode = previousChallenge.challengeMetadata.match(/CODE-(\d*)/)[1];
  }

  event.response.publicChallengeParameters = {
    phone: event.request.userAttributes.phone_number,
  };
  event.response.privateChallengeParameters = { passCode };
  event.response.challengeMetadata = `CODE-${passCode}`;

  console.log('RETURNED event: ', JSON.stringify(event, null, 2));

  return event;
};

export const verifyAuthChallenge = async (event: any) => {
  console.log('RECEIVED Event: ', JSON.stringify(event, null, 2));

  const expectedAnswer =
    event.request.privateChallengeParameters.passCode || null;

  if (event.request.challengeAnswer === expectedAnswer) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }

  console.log('RETURNED Event: ', JSON.stringify(event, null, 2));

  return event;
};

export const defineAuthChallenge = async (event: any) => {
  console.log('RECEIVED event: ', JSON.stringify(event, null, 2));

  // If user is not registered
  if (event.request.userNotFound) {
    console.log('User does not exist');
    event.response.issueToken = false;
    event.response.failAuthentication = true;
    throw new Error('User does not exist');
  }

  if (
    event.request.session &&
    event.request.session.length &&
    event.request.session.slice(-1)[0].challengeName == 'SRP_A'
  ) {
    event.request.session = [];
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  }
  // Correct OTP
  else if (
    event.request.session &&
    event.request.session.length &&
    event.request.session.slice(-1)[0].challengeName === 'CUSTOM_CHALLENGE' &&
    event.request.session.slice(-1)[0].challengeResult === true
  ) {
    console.log('The user provided the right answer to the challenge');
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  }
  // After 3 failed challenge responses from user, fail authentication
  else if (
    event.request.session &&
    event.request.session.length >= 3 &&
    event.request.session.slice(-1)[0].challengeResult === false
  ) {
    console.log(
      'FAILED Authentication: The user provided a wrong answer 3 times'
    );
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    throw new Error('Invalid OTP');
  }
  // The user did not provide a correct answer yet; present CUSTOM_CHALLENGE again
  else {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  }

  console.log('RETURNED event: ', JSON.stringify(event, null, 2));

  return event;
};

export const preSignUp = async (event: any) => {
  console.log('Received EVENT', JSON.stringify(event, null, 2));

  event.response.autoConfirmUser = true;
  if (event.request.userAttributes.hasOwnProperty('phone_number')) {
    event.response.autoVerifyPhone = true;
  }
  return event;
};
