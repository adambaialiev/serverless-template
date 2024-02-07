import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { repositoryName, authToken } = JSON.parse(event.body);

		const octokit = new Octokit({
			auth: authToken as string,
		});

		const response = await octokit.repos.createForAuthenticatedUser({
			name: repositoryName as string,
		});

		return sendResponse(200, { message: JSON.stringify(response.data) });
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
