import { ethers } from 'ethers';
import { contractAbi } from '@/services/crypto/usdt-erc20-contractAbi';
import { USDT_CONTRACT_IN_POLYON } from '@/services/crypto/constants';

export const amountToRaw = (amount: number) =>
	amount.toFixed(6).replace(/\./g, '');

export const rawAmountToRealAmount = (value: string) => {
	if (value.length < 6) {
		return undefined;
	}
	const decimals = value.slice(-6);
	const main = value.slice(0, value.length - 6);

	return `${main}.${decimals}`;
};

export default class CryptoEthersService {
	constructor() {
		this.provider = new ethers.JsonRpcProvider(process.env.NODE_PROVIDER);
	}

	provider: ethers.JsonRpcProvider;

	async getBalanceOfAddress(address: string) {
		const erc20_r = new ethers.Contract(
			USDT_CONTRACT_IN_POLYON,
			contractAbi,
			this.provider
		);
		const balance = await erc20_r.balanceOf(address);
		console.log({ balance, balanceString: String(balance) });
		return String(balance);
	}
}
