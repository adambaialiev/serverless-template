import { USDT_CONTRACT_IN_POLYON } from '@/services/crypto/constants';
import { contractAbi } from '@/services/crypto/usdt-erc20-contractAbi';
import { Network, Alchemy, Wallet, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';

export default class CryptoAlchemy {
	alchemy: Alchemy;
	alchemyProvider: ethers.AlchemyProvider;

	constructor() {
		const apiKey = process.env.ALCHEMY_API_KEY;
		const authToken = process.env.ALCHEMY_NOTIFY_AUTH_TOKEN;
		const settings = {
			apiKey,
			network: Network.MATIC_MAINNET,
			authToken,
		};
		console.log({ apiKey, authToken });
		this.alchemy = new Alchemy(settings);
		this.alchemyProvider = new ethers.AlchemyProvider(
			{ chainId: 137, name: 'matic' },
			apiKey
		);
	}

	async addAddress(address: string) {
		const webhookId = process.env.WEBHOOK_ID;
		console.log({ webhookId });
		await this.alchemy.notify.updateWebhook(webhookId, {
			addAddresses: [address],
		});
	}

	async makePolygonUsdtTransaction(
		privateKey: string,
		targetPublicKey: string,
		amount: string
	): Promise<string | undefined> {
		try {
			console.log('makePolygonUsdtTransaction', {
				privateKey,
				targetPublicKey,
				amount,
			});
			const { gasPrice } = await this.alchemy.core.getFeeData();
			if (!gasPrice) {
				return undefined;
			}
			const signer = new ethers.Wallet(privateKey, this.alchemyProvider);
			const erc20_rw = new ethers.Contract(
				USDT_CONTRACT_IN_POLYON,
				contractAbi,
				signer
			);
			console.log({ gasPrice });
			const converted = Utils.formatEther(gasPrice);
			console.log({ converted });
			const transaction = await erc20_rw.transfer(targetPublicKey, amount, {
				from: signer.address,
				gasPrice: gasPrice.toBigInt(),
				gasLimit: 100000,
			});
			console.log({ usdtTransaction: transaction });
			return transaction.hash;
		} catch (error) {
			console.log({ error });
		}
	}

	async makePolygonMaticTransaction(
		privateKey: string,
		address: string,
		amount: string
	): Promise<string | undefined> {
		console.log('makePolygonMaticTransaction', { privateKey, address, amount });
		try {
			const wallet = new Wallet(privateKey);
			const { gasPrice } = await this.alchemy.core.getFeeData();

			if (!gasPrice) {
				return undefined;
			}
			console.log({ gasPrice });
			const transaction = {
				to: address,
				value: Utils.parseEther(amount),
				gasLimit: 100000,
				nonce: await this.alchemy.core.getTransactionCount(wallet.getAddress()),
				chainId: 137,
				gasPrice,
			};
			const rawTransaction = await wallet.signTransaction(transaction);
			const transactionResponse = await this.alchemy.transact.sendTransaction(
				rawTransaction
			);
			console.log({ maticTransaction: transactionResponse });
			return transactionResponse.hash;
		} catch (error) {
			console.log({ error });
		}
	}
}
