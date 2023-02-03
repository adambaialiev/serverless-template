import https from 'https';

type httpPost = (args: any) => void;

export const httpsPost: httpPost = ({ body, ...options }) => {
	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				method: 'POST',
				...options,
			},
			(res) => {
				const chunks: any = [];
				res.on('data', (data) => chunks.push(data));
				res.on('end', () => {
					let resBody: any = Buffer.concat(chunks);
					switch (res.headers['content-type']) {
						case 'application/json':
							resBody = JSON.parse(resBody);
							break;
					}
					resolve(resBody);
				});
			}
		);
		req.on('error', reject);
		if (body) {
			req.write(body);
		}
		req.end();
	});
};
