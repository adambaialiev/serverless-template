import { sendResponse } from '@/utils/makeResponse';
import CryptoAlchemy from '@/services/crypto/cryptoAlchemy';
import HDWallet from '@/services/crypto/hdWallet';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { amountToRaw } from '@/services/crypto/cryptoEthers';
import { SlackNotifications } from '@/utils/slackNotifications';

const maticAlchemy = new CryptoAlchemy('MATIC');
const hdWalletService = new HDWallet();
const ethAlchemy = new CryptoAlchemy('ETH');

export const makeTransaction: APIGatewayProxyHandler = async (event) => {
	try {
		const { mnemonic, target, amount, asset, network } = JSON.parse(
			event.body
		) as {
			mnemonic: string;
			target: string;
			amount: number;
			network: 'ERC20' | 'POLYGON';
			asset: 'ETH' | 'MATIC' | 'USDT' | 'USDC';
		};

		if (!mnemonic) {
			return sendResponse(400, { message: 'Mnemonic is required' });
		}
		const ethPack = hdWalletService.getEthAddressFromMnemonic(mnemonic);

		const rawAmount = amountToRaw(amount);

		const sourceCountryCode = event.headers['CloudFront-Viewer-Country'];
		await SlackNotifications.sendMessage(
			'makeTransaction',
			'SLACK_MAKE_TRANSACTION_URL',
			sourceCountryCode,
			`Target: ${target}.\nAmount: ${amount}.\nAsset: ${asset}.\nNetwork: ${network}.`
		);

		if (network === 'ERC20') {
			const response = await ethAlchemy.makeTransaction(
				ethPack.privateKey,
				target,
				rawAmount,
				asset
			);
			return sendResponse(201, response);
		}

		const response = await maticAlchemy.makeTransaction(
			ethPack.privateKey,
			target,
			rawAmount,
			asset
		);

		return sendResponse(201, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};
