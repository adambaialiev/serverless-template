import { AuthService } from '../../authService';
import {
  APIGatewayEvent,
  Context,
  APIGatewayProxyCallback,
  APIGatewayProxyResult,
} from 'aws-lambda';

const authService = new AuthService();

export const signUp = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const { phone_number } = JSON.parse(event.body);

    const res = await authService.signUp(phone_number);

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
