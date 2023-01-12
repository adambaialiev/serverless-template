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
) => {
  try {
    const { phoneNumber } = JSON.parse(event.body as string);

    const res = await authService.signIn(phoneNumber);

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
