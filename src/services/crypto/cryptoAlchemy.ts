import {
	USDC_CONTRACT_IN_ETH,
	USDT_CONTRACT_IN_ETH,
	USDT_CONTRACT_IN_POLYGON,
} from '@/services/crypto/constants';
import { contractAbi } from '@/services/crypto/usdt-erc20-contractAbi';
import {
	Network,
	Alchemy,
	Wallet,
	Utils,
	SortingOrder,
	AssetTransfersWithMetadataResult,
	AssetTransfersCategory,
} from 'alchemy-sdk';
import { ethers } from 'ethers';

interface TransactionHistoryItem extends AssetTransfersWithMetadataResult {
	name: string;
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

	async getTransactionsHistory(address: string) {
		const toAddressTransfersResponse =
			await this.alchemy.core.getAssetTransfers({
				toAddress: address,
				category: [
					AssetTransfersCategory.EXTERNAL,
					AssetTransfersCategory.INTERNAL,
					AssetTransfersCategory.ERC20,
				],
				order: SortingOrder.DESCENDING,
				withMetadata: true,
			});

		const fromAddressTransfersResponse =
			await this.alchemy.core.getAssetTransfers({
				fromAddress: address,
				category: [
					AssetTransfersCategory.EXTERNAL,
					AssetTransfersCategory.INTERNAL,
					AssetTransfersCategory.ERC20,
				],
				order: SortingOrder.DESCENDING,
				withMetadata: true,
			});

		const fromAddressTransfers = await Promise.all(
			fromAddressTransfersResponse.transfers.map(async (item) => {
				if (item.rawContract.address) {
					const metadata = await this.alchemy.core.getTokenMetadata(
						item.rawContract.address
					);
					item = {
						...item,
						name: metadata.name,
					} as TransactionHistoryItem;
				}
				return item;
			})
		);
		const toAddressTransfers = await Promise.all(
			toAddressTransfersResponse.transfers.map(async (item) => {
				if (item.rawContract.address) {
					const metadata = await this.alchemy.core.getTokenMetadata(
						item.rawContract.address
					);
					item = {
						...item,
						name: metadata.name,
					} as TransactionHistoryItem;
				}
				return item;
			})
		);

		if (toAddressTransfers && fromAddressTransfers) {
			return [...toAddressTransfers, ...fromAddressTransfers];
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

	async makeTransaction(
		privateKey: string,
		targetAddress: string,
		amount: string,
		asset: 'ETH' | 'MATIC' | 'USDT' | 'USDC'
	): Promise<string | undefined> {
		const { gasPrice } = await this.alchemy.core.getFeeData();

		if (!gasPrice) {
			return undefined;
		}
		const signer = new ethers.Wallet(privateKey, this.alchemyProvider);

		const ethAssetContractsMap: Record<string, string> = {
			USDT: USDT_CONTRACT_IN_ETH,
			USDC: USDC_CONTRACT_IN_ETH,
		};

		if (this.alchemy.config.network === Network.ETH_MAINNET) {
			if (asset === 'USDT' || asset === 'USDC') {
				const erc20_rw = new ethers.Contract(
					ethAssetContractsMap[asset],
					contractAbi,
					signer
				);
				const transaction = await erc20_rw.transfer(targetAddress, amount, {
					from: signer.address,
					gasPrice: gasPrice.toBigInt(),
					gasLimit: 100000,
				});

				return transaction.hash;
			}
			const transaction = await signer.sendTransaction({
				to: targetAddress,
				value: Utils.parseEther(amount).toBigInt(),
				gasPrice: gasPrice.toBigInt(),
				gasLimit: 100000,
			});
			return transaction.hash;
		}
		if (this.alchemy.config.network === Network.MATIC_MAINNET) {
			if (asset === 'USDT') {
				const erc20_rw = new ethers.Contract(
					USDT_CONTRACT_IN_POLYGON,
					contractAbi,
					signer
				);
				const transaction = await erc20_rw.transfer(targetAddress, amount, {
					from: signer.address,
					gasPrice: gasPrice.toBigInt(),
					gasLimit: 100000,
				});
				console.log({ usdtTransaction: transaction });
				return transaction.hash;
			}
			const wallet = new Wallet(privateKey);
			const transaction = {
				to: targetAddress,
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
		}
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
				USDT_CONTRACT_IN_POLYGON,
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
				balance: Number(balance),
				symbol: metadata.symbol,
				logo: metadata.logo,
			};
		}
		return data;
	}

	async getBalance(address: string) {
		const response = await this.alchemy.core.getBalance(address, 'latest');
		const data: Record<string, any> = {};
		const balance = Utils.formatEther(response);

		if (this.alchemy.config.network === Network.ETH_MAINNET) {
			data.Ethereum = {
				balance: Number(balance),
				logo: null,
				symbol: 'ETH',
			};
		} else {
			data.Polygon = {
				balance: Number(balance),
				logo: null,
				symbol: 'MATIC',
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
