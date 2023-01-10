import { v4 } from "uuid";
import { DynamoDB } from "../common/dynamo/Dynamo";

const dynamoDB = new DynamoDB();

export const preSignUp = async (event: any) => {
  console.log("Received EVENT", JSON.stringify(event, null, 2));

  const params = {
    phone_number: event.request.userAttributes.phone_number,
    balance: 0,
  };
  await dynamoDB.putItem(process.env.dynamo_table, params);

  event.response.autoConfirmUser = true;
  if (event.request.userAttributes.hasOwnProperty("phone_number")) {
    event.response.autoVerifyPhone = true;
  }
  return event;
};
