import { Coin } from '@/services/crypto/cryptoEthers';
import axios from 'axios';

const ETHERSCAN_ENDPOINT = 'https://api.etherscan.io/api';
const POLYGONSCAN_ENDPOINT = 'https://api.polygonscan.com/api';

export default class CryptoTransactions {
	async getNativeCoinTransactions(coin: Coin, address: string) {
		let endpoint: string | undefined;
		let apikey: string | undefined;
		if (coin === 'ETH') {
			endpoint = ETHERSCAN_ENDPOINT;
			apikey = process.env.ETHERSCAN_API_KEY;
		}
		if (coin === 'MATIC') {
			endpoint = POLYGONSCAN_ENDPOINT;
			apikey = process.env.POLYGONSCAN_API_KEY;
		}
		if (!coin) {
			throw new Error('Coin not supported');
		}
		const response = await axios.get(endpoint, {
			params: {
				address,
				action: 'txlist',
				apikey,
			},
		});
		if (response.data && response.data.result) {
			return response.data.result;
		}
		return undefined;
	}
}
