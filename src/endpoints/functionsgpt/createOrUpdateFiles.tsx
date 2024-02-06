/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const {
			repositoryName,
			owner,
			authToken,
			paths,
			contents,
			commitMessage,
			sha,
			branch,
		} = JSON.parse(event.body);

		const octokit = new Octokit({
			auth: authToken as string,
		});

		const responses: any[] = [];

		for (const [index, path] of paths.entries()) {
			const content = contents[index];
			const response = await octokit.repos.createOrUpdateFileContents({
				owner: owner,
				repo: repositoryName,
				path,
				message: commitMessage,
				content: Buffer.from(content).toString('base64'),
				sha,
				branch,
			});
			responses.push(response.data);
		}

		return sendResponse(200, { response: JSON.stringify(responses) });
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
