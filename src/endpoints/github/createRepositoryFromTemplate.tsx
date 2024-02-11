import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const {
			repositoryName,
			authToken,
			templateOwner,
			templateRepo,
			owner,
			isPrivate,
		} = JSON.parse(event.body);

		const octokit = new Octokit({
			auth: authToken as string,
		});
		const response = await octokit.repos.createUsingTemplate({
			template_owner: templateOwner,
			template_repo: templateRepo,
			owner,
			name: repositoryName,
			private: isPrivate,
		});

		return sendResponse(200, {
			response: JSON.stringify(response.data, null, 2),
		});
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
