import { AuthService } from '../../authService';
import {
  APIGatewayEvent,
  Context,
  APIGatewayProxyCallback,
  APIGatewayProxyResult,
} from 'aws-lambda';

const authService = new AuthService();

export const signIn = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback
): Promise<APIGatewayProxyResult> => {
  try {
    const { phone_number, session, passCode } = JSON.parse(event.body);

    const res = await authService.signIn(phone_number, passCode, session);

    callback(null, {
      statusCode: 201,
      body: JSON.stringify(res),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log({ error });
      return {
        statusCode: 500,
        body: error.message,
      };
    }
  }
};
