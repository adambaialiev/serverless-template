import { contractAbi } from '@/services/crypto/contractAbi';
import { ethers, parseEther } from 'ethers';
import Web3 from 'web3';
import axios from 'axios';

const USDT_CONTRACT_IN_POLYON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const ORACLE_ENDPOINT =
	'https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=5X5SKNQ1M31NP3FP8A7SVJNV9UEM2FFQFT';

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

const amountToRaw = (amount: number) => amount.toFixed(6).replace(/\./g, '');

export default class CryptoEthersService {
	constructor() {
		this.provider = new ethers.JsonRpcProvider(
			'https://nd-552-463-930.p2pify.com/14b83362eb8642f9ebc4922235a55a15'
		);
	}

	provider: ethers.JsonRpcProvider;

	async makePolygonUsdtTransaction(
		privateKey: string,
		targetPublicKey: string,
		amount: number
	) {
		const gasOracleResponse = await axios.get<GasOracle>(ORACLE_ENDPOINT);
		if (!gasOracleResponse.data) {
			throw new Error('Can not retrieve gasOracleResponse');
		}
		const signer = new ethers.Wallet(privateKey, this.provider);
		const erc20_rw = new ethers.Contract(
			USDT_CONTRACT_IN_POLYON,
			contractAbi,
			signer
		);
		const rawAmount = amountToRaw(amount);
		console.log({ rawAmount });
		const transaction = await erc20_rw.transfer(targetPublicKey, rawAmount, {
			from: signer.address,
			gasPrice: Web3.utils.toWei(
				gasOracleResponse.data.result.SafeGasPrice,
				'Gwei'
			),
		});
		console.log({ transaction });
	}

	async makePolygonMaticTransaction(privateKey: string) {
		const gasOracleResponse = await axios.get<GasOracle>(ORACLE_ENDPOINT);
		if (!gasOracleResponse.data) {
			throw new Error('Can not retrieve gasOracleResponse');
		}
		const signer = new ethers.Wallet(privateKey, this.provider);
		const tx = {
			from: signer.address,
			to: '0x9cddeB80a7BE37e7daCA7e9c4F193e781dD157e6',
			value: parseEther('0.02'),
			gasPrice: Web3.utils.toWei(
				gasOracleResponse.data.result.FastGasPrice,
				'Gwei'
			),
		};
		const transaction = await signer.sendTransaction(tx);
		console.log({ transaction });
	}
}
