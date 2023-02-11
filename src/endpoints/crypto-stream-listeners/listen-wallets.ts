import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { getAllWalletsAddresses } from '@/services/cryptoStreams/getAllWalletsAddresses';
import MasterWallet from '@/services/masterWallet/masterWallet';
import { MasterWalletInvolvedTransactionAttributes } from '@/common/dynamo/schema';
import { CryptoService } from '@/services/crypto/crypto';

interface CryptoTransaction {
	hash: string;
	gas: string;
	gasPrice: string;
	nonce: string;
	transactionIndex: string;
	fromAddress: string;
	toAddress: string;
	value: string;
}

interface CryptoStreamEvent {
	confirmed: boolean;
	chainId: string;
	streamId: string;
	tag: string;
	txs: CryptoTransaction[];
}

export const handler: APIGatewayProxyHandler = async (
	event,
	context,
	callback
) => {
	try {
		const body = JSON.parse(event.body);

		if (!body.txs.length) {
			callback(null, {
				statusCode: 200,
				body: JSON.stringify(true),
			});
		} else {
			const cryptoEvent = body as CryptoStreamEvent;
			const masterWalletService = new MasterWallet();
			const cryptoService = new CryptoService();

			const allWalletsAddresses = await getAllWalletsAddresses();

			if (!cryptoEvent.confirmed) {
				callback(null, {
					statusCode: 200,
					body: JSON.stringify(true),
				});
			}

			// detect deposit transactions and initialize touch operation
			for (const transaction of cryptoEvent.txs) {
				const targetWallet = allWalletsAddresses.find(
					(w) => w.address === transaction.toAddress
				);
				if (targetWallet) {
					await masterWalletService.touchUserWallet(
						targetWallet.address,
						targetWallet.phoneNumber
					);
				}
			}

			// detect touch operation and initialize home operation
			const touchPendingTransactions =
				await masterWalletService.getTouchPendingTransactions();
			if (touchPendingTransactions) {
				for (const transaction of cryptoEvent.txs) {
					const targetPendingTransaction = touchPendingTransactions.find(
						(t) =>
							t[MasterWalletInvolvedTransactionAttributes.ID] ===
							transaction.hash
					);
					if (targetPendingTransaction) {
						cryptoService.makePolygonUsdtTransactionToMasterWallet();
					}
				}
			}
			// detect home operation and update it to success
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log({ error });
			return sendResponse(500, { message: error.message });
		}
	}
};

export const listenWallets = handler;
