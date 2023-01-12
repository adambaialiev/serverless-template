import AWS from 'aws-sdk';
import { SessionType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { makePassword } from './utils/makePassword';

export const poolData = {
  UserPoolId: process.env.user_pool_id as string,
  ClientId: process.env.client_id as string,
};

const cognito = new AWS.CognitoIdentityServiceProvider();

export class AuthService {
  async signIn(phoneNumber: string) {
    const input = {
      UserPoolId: poolData.UserPoolId,
      ClientId: poolData.ClientId,
      AuthFlow: 'CUSTOM_AUTH',
      AuthParameters: {
        USERNAME: phoneNumber,
      },
    };
    return cognito.adminInitiateAuth(input).promise();
  }
  async verifySignIn(code: string, phoneNumber: string, session: SessionType) {
    const input = {
      ClientId: poolData.ClientId,
      ChallengeName: 'CUSTOM_CHALLENGE',
      Session: session,
      ChallengeResponses: {
        ANSWER: code,
        USERNAME: phoneNumber,
      },
    };
    return await cognito.respondToAuthChallenge(input).promise();
  }
  async signUp(phone_number: string) {
    const input = {
      Password: makePassword(),
      Username: phone_number,
      ClientId: poolData.ClientId,
    };
    return cognito.signUp(input).promise();
  }
}
