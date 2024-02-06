import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { repositoryName, owner, authToken, paths, branch } = JSON.parse(
			event.body
		);

		const octokit = new Octokit({
			auth: authToken as string,
		});

		const responses: { [key: string]: { content: string; sha: string } } = {};

		for (const path of paths.entries()) {
			const response = await octokit.repos.getContent({
				owner,
				repo: repositoryName,
				path,
				ref: branch,
			});
			if ('content' in response.data && response.data.content) {
				const content = Buffer.from(response.data.content, 'base64').toString(
					'utf8'
				);
				responses[path] = { content, sha: response.data.sha };
			}
		}

		return sendResponse(200, { response: JSON.stringify(responses) });
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
