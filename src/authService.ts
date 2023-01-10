import AWS from 'aws-sdk';
import { SessionType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { makePassword } from './utils/makePassword';

export const poolData = {
  UserPoolId: process.env.user_pool_id,
  ClientId: process.env.client_id,
};

const cognito = new AWS.CognitoIdentityServiceProvider();

export class AuthService {
  async signIn(phone_number: string, passCode: string, session: SessionType) {
    const params = {
      ChallengeName: 'CUSTOM_CHALLENGE',
      UserPoolId: poolData.UserPoolId,
      ClientId: poolData.ClientId,
      Session: session,
      ChallengeResponses: {
        USERNAME: phone_number,
        ANSWER: passCode,
      },
    };

    return cognito.adminRespondToAuthChallenge(params).promise();
  }
  async signUp(phone_number: string) {
    const params = {
      AuthFlow: 'CUSTOM_AUTH',
      UserPoolId: poolData.UserPoolId,
      ClientId: poolData.ClientId,
      AuthParameters: {
        USERNAME: phone_number,
      },
    };

    await cognito
      .signUp({
        ClientId: poolData.ClientId,
        Username: phone_number,
        Password: makePassword(),
      })
      .promise();
    const response = await cognito.adminInitiateAuth(params).promise();
    return response;
  }
}
