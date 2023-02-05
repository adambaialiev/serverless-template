import {
	withAuthorization,
	CustomAPIGateway,
} from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import { APIGatewayProxyHandler } from 'aws-lambda';

const handler: APIGatewayProxyHandler = async (
	event: CustomAPIGateway,
	context,
	callback
) => {
	try {
		const { amount, publicKey } = JSON.parse(event.body);

		const userPhoneNumber = event.user.phoneNumber;

		console.log('amount', JSON.stringify(amount, null, 2));
		console.log('publicKey', JSON.stringify(publicKey, null, 2));
		console.log('userPhoneNumber', JSON.stringify(userPhoneNumber, null, 2));

		callback(null, {
			statusCode: 201,
			body: JSON.stringify({
				userPhoneNumber,
				amount,
				publicKey,
			}),
		});
	} catch (error: unknown) {
		console.log({ error });
		if (error instanceof Error) {
			return sendResponse(500, { message: error.message });
		}
	}
};

export const withdraw = withAuthorization(handler);
