import AWS from 'aws-sdk';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { SessionType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { makePassword } from './utils/makePassword';

export const poolData = {
  UserPoolId: 'us-east-1_Uy7RQSyPg',
  ClientId: '7vf1d03uaqiec4294emjujm18g',
};

const UserPool = new CognitoUserPool(poolData);
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
    await this.preSignUpUser(phone_number);

    const response = await cognito.adminInitiateAuth(params).promise();
    return response;
  }
  async preSignUpUser(username: string) {
    return new Promise((resolve, reject) => {
      UserPool.signUp(username, makePassword(), [], [], (err: any, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve({
          status: 201,
          message: 'Success sign up',
          data,
        });
      });
    });
  }
}
