import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { repositoryName, authToken } = JSON.parse(event.body);

		const octokit = new Octokit({
			auth: authToken as string,
		});

		const response = await octokit.repos.createForAuthenticatedUser({
			name: repositoryName as string,
		});

		return {
			statusCode: 200,
			body: JSON.stringify(response.data),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: error.message,
		};
	}
};
