import { UserAttributes } from '@/common/dynamo/schema';
import { getUserCompositeKey } from '@/services/auth/auth';
import { contractAbi } from '@/services/crypto/contractAbi';
import MasterWallet from '@/services/masterWallet/masterWallet';
import { IWallet } from '@/services/user/types';
import AWS from 'aws-sdk';
import Web3 from 'web3';
import axios from 'axios';
import PusherService from '@/services/pusher/pusher';

interface GasOracle {
	status: string;
	message: string;
	result: {
		LastBlock: string;
		SafeGasPrice: string;
		ProposeGasPrice: string;
		FastGasPrice: string;
		suggestBaseFee: string;
		gasUsedRatio: string;
		UsdPrice: string;
	};
}

const USDT_CONTRACT_IN_POLYON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

const getWeb3Instance = () => {
	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			'https://nd-552-463-930.p2pify.com/14b83362eb8642f9ebc4922235a55a15'
		)
	);
	return web3;
};

export class CryptoService {
	async createCryptoWallet(phoneNumber: string) {
		const web3 = getWeb3Instance();
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		web3.eth.accounts.wallet.add(account);

		const wallet: IWallet = {
			privateKey: account.privateKey,
			publicKey: account.address,
			chain: 'mainnet',
			network: 'polygon',
			phoneNumber,
		};

		const params = {
			TableName,
			Key: getUserCompositeKey(phoneNumber),
			UpdateExpression: `SET #wallets = :wallets`,
			ExpressionAttributeNames: {
				'#wallets': UserAttributes.WALLETS,
			},
			ExpressionAttributeValues: {
				':wallets': [wallet],
			},
		};

		await dynamo.update(params).promise();

		const pusherService = new PusherService();

		await pusherService.triggerUsersWalletsUpdated();
		return account;
	}

	async createMasterWallet() {
		const web3 = getWeb3Instance();
		const account = web3.eth.accounts.create(web3.utils.randomHex(32));
		web3.eth.accounts.wallet.add(account);
		return account;
	}

	async sendMaticToAddress(publicKey: string, amount: string) {
		const web3 = getWeb3Instance();
		console.log({ web3 });
		const masterWalletService = new MasterWallet();
		const masterWallet = await masterWalletService.getMasterWallet();
		if (!masterWallet) {
			return;
		}
		const signer = web3.eth.accounts.privateKeyToAccount(
			masterWallet.privateKey
		);
		console.log({ signer });
		web3.eth.accounts.wallet.add(signer);

		const gasOracleResponse = await axios.get<GasOracle>(
			'https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=5X5SKNQ1M31NP3FP8A7SVJNV9UEM2FFQFT'
		);

		if (!gasOracleResponse.data) {
			throw new Error('Can not retrieve gasOracleResponse');
		}

		const gasOracle = gasOracleResponse.data;

		const tx = {
			from: signer.address,
			to: publicKey,
			value: web3.utils.toWei(amount),
			gas: 0,
			gasPrice: web3.utils.toWei(gasOracle.result.SafeGasPrice, 'Gwei'),
		};

		tx.gas = await web3.eth.estimateGas(tx);

		console.log({ tx });

		const transactionHash = await new Promise<string | undefined>((resolve) => {
			// Sending the transaction to the network
			web3.eth.sendTransaction(tx).once('transactionHash', (txhash) => {
				console.log(`Mining transaction ...`);
				console.log(`Transaction hash: ${txhash}`);
				resolve(txhash);
			});
		});
		console.log({ transactionHash });
		return transactionHash;
	}

	async makePolygonUsdtTransactionToMasterWallet(
		privateKey: string,
		sourcePublicKey: string
	) {
		const web3 = getWeb3Instance();

		const masterWalletService = new MasterWallet();
		const masterWallet = await masterWalletService.getMasterWallet();
		console.log({ masterWallet });
		if (masterWallet) {
			const signer = web3.eth.accounts.privateKeyToAccount(privateKey);
			web3.eth.accounts.wallet.add(signer);

			const contract = new web3.eth.Contract(
				contractAbi,
				USDT_CONTRACT_IN_POLYON
			);

			const balance = await contract.methods.balanceOf(sourcePublicKey).call();
			console.log({ balance });

			const gasOracleResponse = await axios.get<GasOracle>(
				'https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=5X5SKNQ1M31NP3FP8A7SVJNV9UEM2FFQFT'
			);

			if (!gasOracleResponse.data) {
				throw new Error('Can not retrieve gasOracleResponse');
			}

			const gasOracle = gasOracleResponse.data;

			const tx = {
				from: signer.address,
				gas: 0,
				gasPrice: web3.utils.toWei(gasOracle.result.SafeGasPrice, 'Gwei'),
			};
			console.log({ tx });
			tx.gas = await web3.eth.estimateGas(tx);

			const hash = await new Promise<string | undefined>((resolve) => {
				contract.methods
					.transfer(masterWallet.publicAddress, balance)
					.send(tx)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.on('transactionHash', (hash: any) => {
						console.log({ hash });
						resolve(hash);
					});
			});
			return hash;
		}
	}

	async makePolygonUsdtTransactionWithdrawFromMasterWallet(
		targetPublicKey: string,
		amount: string
	) {
		const web3 = getWeb3Instance();
		const masterWalletService = new MasterWallet();
		const masterWallet = await masterWalletService.getMasterWallet();
		if (masterWallet) {
			const signer = web3.eth.accounts.privateKeyToAccount(
				masterWallet.privateKey
			);
			web3.eth.accounts.wallet.add(signer);

			const contract = new web3.eth.Contract(
				contractAbi,
				USDT_CONTRACT_IN_POLYON
			);

			const hash = await new Promise<string | undefined>((resolve) => {
				contract.methods
					.transfer(targetPublicKey, amount)
					.send({ from: signer.address })
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.on('transactionHash', (hash: any) => {
						console.log({ hash });
						resolve(hash);
					});
			});
			return hash;
		}
	}
}
