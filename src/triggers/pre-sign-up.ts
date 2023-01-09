import { v4 } from 'uuid';
import { DynamoDB } from '../common/Dynamo';

const dynamoDB = new DynamoDB();

export const preSignUp = async (event: any) => {
  console.log('Received EVENT', JSON.stringify(event, null, 2));

  const registeredUser = await dynamoDB.getItem(process.env.dynamo_table, {
    phone_number: { S: event.request.userAttributes.phone_number },
  });

  console.log('registeredUser', JSON.stringify(registeredUser));

  if (!registeredUser) {
    const params = {
      phone_number: event.request.userAttributes.phone_number,
      balance: 0,
      id: v4(),
    };
    await dynamoDB.putItem(process.env.dynamo_table, params);
  }

  event.response.autoConfirmUser = true;
  if (event.request.userAttributes.hasOwnProperty('phone_number')) {
    event.response.autoVerifyPhone = true;
  }
  return event;
};
