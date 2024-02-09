/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Octokit } from '@octokit/rest';
import { sendResponse } from '@/utils/makeResponse';

// eslint-disable-next-line func-style
function isBase64(content: string) {
	const base64RegExp =
		/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
	return base64RegExp.test(content);
}

export const main: APIGatewayProxyHandler = async (event) => {
	try {
		const {
			repositoryName,
			owner,
			authToken,
			paths,
			contents,
			commitMessage,
			shas,
			branch,
		} = JSON.parse(event.body);

		const octokit = new Octokit({
			auth: authToken as string,
		});

		const responses: any[] = [];

		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];
			const content = contents[i];
			const sha = shas ? shas[i] : undefined;

			const finalContent = isBase64(content as string)
				? content
				: Buffer.from(content as string).toString('base64');

			const response = await octokit.repos.createOrUpdateFileContents({
				owner: owner,
				repo: repositoryName,
				path,
				message: commitMessage,
				content: finalContent,
				sha,
				branch,
			});
			console.log({ response: JSON.stringify(response, null, 2) });
			responses.push(response.data);
		}

		return sendResponse(200, { response: JSON.stringify(responses) });
	} catch (error) {
		if (error instanceof Error) {
			return sendResponse(500, error);
		}
	}
};
