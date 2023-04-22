import axios from 'axios';

const headers = {
	'Content-Type': 'application/json',
	'x-api-key': process.env.TATUM_API_KEY,
};

export default class CryptoTatum {
	async createSubscription(address: string) {
		const params = {
			type: 'ADDRESS_TRANSACTION',
			attr: {
				address: address,
				chain: 'MATIC',
				url: process.env.TATUM_WEBHOOK_URL,
			},
		};

		await axios.post('https://api.tatum.io/v3/subscription', params, {
			headers,
		});
	}

	async getBalanceOfAddress(
		address: string,
		chain: 'ethereum' | 'polygon' | 'bsc'
	) {
		const response = await axios.get('https://api.tatum.io/v3/data/balances', {
			params: {
				chain,
				addresses: address,
				tokenTypes: 'fungible',
				excludeMetadata: true,
				pageSize: '100',
				offset: '0',
			},
			headers,
		});
		console.log({ response });
		if (response.data) {
			return response.data.results;
		}
	}
}
