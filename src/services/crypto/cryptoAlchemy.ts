import { USDT_CONTRACT_IN_POLYON } from '@/services/crypto/constants';
import { contractAbi } from '@/services/crypto/usdt-erc20-contractAbi';
import { Network, Alchemy, Wallet, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';

export default class CryptoAlchemy {
	alchemy: Alchemy;
	alchemyProvider: ethers.AlchemyProvider;

	constructor() {
		const apiKey = process.env.ALCHEMY_API_KEY;
		const settings = {
			apiKey,
			network: Network.MATIC_MAINNET,
		};
		console.log({ apiKey });
		this.alchemy = new Alchemy(settings);
		this.alchemyProvider = new ethers.AlchemyProvider(
			{ chainId: 137, name: 'matic' },
			apiKey
		);
	}

	async getValidatedBlocks(
		hash: string,
		blockNum: string
	): Promise<number | undefined> {
		const latestBlock = await this.alchemy.core.getBlockNumber();
		console.log({ latestBlock, hash, blockNum });
		const targetBlock = await this.alchemy.core.getBlock(blockNum);

		console.log({ targetBlock });
		if (targetBlock) {
			const { number } = targetBlock;
			return latestBlock - number;
		}
		return undefined;
	}

	async getValidatedBlocksWithReadyBlockNum(
		hash: string,
		blockNum: string
	): Promise<number | undefined> {
		const latestBlock = await this.alchemy.core.getBlockNumber();
		console.log({ latestBlock, hash, blockNum });
		const targetBlock = Number(blockNum);
		console.log({ targetBlock });
		return latestBlock - targetBlock;
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
