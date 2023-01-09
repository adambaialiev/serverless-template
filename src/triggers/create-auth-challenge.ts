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

  if (
    (event.request.session &&
      event.request.session.length &&
      event.request.session.slice(-1)[0].challengeName === 'SRP_A') ||
    event.request.session.length === 0
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
  event.response.privateChallengeParameters = { challenge: passCode };
  event.response.challengeMetadata = `CODE-${passCode}`;

  console.log('RETURNED event: ', JSON.stringify(event, null, 2));

  return event;
};
