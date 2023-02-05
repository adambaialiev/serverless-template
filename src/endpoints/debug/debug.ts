import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';

export const debug: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const { contacts } = JSON.parse(event.body as string);

		console.log(JSON.stringify(contacts, null, 2));

		callback(null, {
			statusCode: 200,
			body: JSON.stringify({
				data: contacts,
			}),
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};
