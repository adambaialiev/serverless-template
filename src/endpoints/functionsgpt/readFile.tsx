import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { sendResponse } from '@/utils/makeResponse';

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const { repositoryName, owner, authToken, fileName } = JSON.parse(
			event.body
		);

		const octokit = new Octokit({
			auth: authToken as string,
		});

		const response = await octokit.repos.getContent({
			owner,
			repo: repositoryName,
			path: fileName,
		});
		console.log({ response: JSON.stringify(response.data, null, 2) });

		if ('content' in response.data && response.data.content) {
			const content = Buffer.from(response.data.content, 'base64').toString(
				'utf8'
			);
			return sendResponse(200, { content });
		}
		throw new Error('File content not found.');
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
