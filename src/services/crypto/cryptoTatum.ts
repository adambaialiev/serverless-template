import axios from 'axios';

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
		const headers = {
			'Content-Type': 'application/json',
			'x-api-key': process.env.TATUM_API_KEY,
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
			},
		});
		if (response.data) {
			return response.data.results;
		}
	}
}
