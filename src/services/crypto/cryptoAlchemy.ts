import { USDT_CONTRACT_IN_POLYON } from '@/services/crypto/constants';
import { contractAbi } from '@/services/crypto/usdt-erc20-contractAbi';
import {
	Network,
	Alchemy,
	Wallet,
	Utils,
	SortingOrder,
	AssetTransfersCategory,
} from 'alchemy-sdk';
import { ethers } from 'ethers';

interface TransactionHistoryItem {
	hash: string;
	from: string;
	to: string;
	asset: 'USDT' | 'ETH' | 'MATIC';
	metadata: {
		blockTimestamp: string;
	};
}

const networkMap = {
	MATIC: Network.MATIC_MAINNET,
	ETH: Network.ETH_MAINNET,
};

const ethersNetworkMap = {
	MATIC: { chainId: 137, name: 'matic' },
	ETH: { chainId: 1, name: 'mainnet' },
};

export default class CryptoAlchemy {
	alchemy: Alchemy;
	alchemyProvider: ethers.AlchemyProvider;

	constructor(network: 'MATIC' | 'ETH') {
		const apiKey = process.env.ALCHEMY_API_KEY;
		const settings = {
			apiKey,
			network: networkMap[network],
		};
		this.alchemy = new Alchemy(settings);
		this.alchemyProvider = new ethers.AlchemyProvider(
			ethersNetworkMap[network],
			apiKey
		);
	}

	async getTransactionsHistory(
		address: string
	): Promise<TransactionHistoryItem[] | undefined> {
		const response = await this.alchemy.core.getAssetTransfers({
			toAddress: address,
			category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
			order: SortingOrder.DESCENDING,
			withMetadata: true,
		});
		if (response.transfers) {
			return response.transfers as TransactionHistoryItem[];
		}
		return undefined;
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

	async getTokenBalances(address: string) {
		const balances = await this.alchemy.core.getTokenBalances(address);

		const nonZeroBalances = balances.tokenBalances.filter(
			(token) => token.tokenBalance !== '0'
		);

		const data: Record<string, any> = {};

		for (const token of nonZeroBalances) {
			let balance = token.tokenBalance;

			const metadata = await this.alchemy.core.getTokenMetadata(
				token.contractAddress
			);

			balance = String(Number(balance) / Math.pow(10, metadata.decimals));
			balance = Number(balance).toFixed(2);

			data[metadata.name] = {
				balance,
				symbol: metadata.symbol,
				logo: metadata.logo,
			};
		}
		return data;
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
