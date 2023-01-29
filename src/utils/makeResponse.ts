export const sendResponse = (statusCode: number, body: any) => {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(body),
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	};
	return response;
};
