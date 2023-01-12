import {
  APIGatewayEvent,
  Context,
  APIGatewayProxyCallback,
  APIGatewayProxyResult,
} from "aws-lambda";
import { callbackify } from "util";
import BalanceService from "../../services/balance/balance";
import UserService from "../../services/user/user";

export const makeTransaction = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback
): Promise<APIGatewayProxyResult> => {
  try {
    const { from, to, amount } = JSON.parse(event.body);

    const balanceService = new BalanceService();

    const userService = new UserService();

    const source = await userService.getSlug(from);

    if (Number(source.balance) < amount) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: "you dont have enought money",
        }),
      });
    }

    const target = await userService.getSlug(to);

    await balanceService.makeTransaction(source, target, Number(amount));

    callback(null, {
      statusCode: 201,
      body: JSON.stringify({
        message: "transaction was success",
      }),
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
