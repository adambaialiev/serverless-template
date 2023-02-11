import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';
import AWS from 'aws-sdk';
import {
	Entities,
	TableKeys,
	WalletsStreamAttributes,
	WalletsStreamItem,
} from '@/common/dynamo/schema';
import { contractAbi } from '@/services/cryptoStreams/usdt-erc20-contractAbi';

const API_KEY =
	'0EXNGD2YqLuJYK6F5mCRcDn3klUCUaB2le8fQ0n2A07htR2lhucamxpiFOCk9lhK';

Moralis.start({
	apiKey: API_KEY,
});

const BASE = `${process.env.stage}-api`;

const LISTEN_USER_WALLETS_WEB_HOOK_URL = `https://${BASE}.shopwalletapp.com/api/v1/listeners/listen-user-wallets`;
const LISTEN_MASTER_WALLET_WEB_HOOK_URL = `https://${BASE}.shopwalletapp.com/api/v1/listeners/listen-master-wallet`;

export default class CryptoStreams {
	async createMasterWalletStream(address: string) {
		const stage = process.env.stage as string;
		const stream = {
			chains: [EvmChain.POLYGON],
			description: `monitor master wallet ${stage}`,
			tag: `masterWallet-${stage}`,
			webhookUrl: 'https://webhook.site/a3618227-e317-44d6-a60d-7548cf75ce82',
			includeNativeTxs: true,
		};
		const newStream = await Moralis.Streams.add(stream);
		const { id } = newStream.toJSON();
		console.log({ streamId: id });

		await Moralis.Streams.addAddress({
			address,
			id,
		});
		return id;
	}

	async createWalletsStreamMaticIfNeeded() {
		const streamId = await this.getWalletsStreamMaticId();
		if (streamId) {
			return streamId;
		}
		const stage = process.env.stage as string;
		const stream = {
			chains: [EvmChain.POLYGON],
			description: `monitor all user wallets matic in ${stage}`,
			tag: `userWalletsMatic-${stage}`,
			webhookUrl: 'https://webhook.site/a3618227-e317-44d6-a60d-7548cf75ce82',
			includeNativeTxs: true,
		};
		const newStream = await Moralis.Streams.add(stream);
		const { id } = newStream.toJSON();
		console.log({ streamId: id });

		const dynamo = new AWS.DynamoDB.DocumentClient();

		const TableName = process.env.dynamo_table as string;

		await dynamo
			.put({
				TableName,
				Item: {
					[TableKeys.PK]: Entities.WALLETS_STREAM_MATIC,
					[TableKeys.SK]: Entities.WALLETS_STREAM_MATIC,
					[WalletsStreamAttributes.ID]: id,
				},
				ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
			})
			.promise();

		return id;
	}

	async createWalletsStreamUsdtIfNeeded() {
		const streamId = await this.getWalletsStreamUsdtId();
		if (streamId) {
			return streamId;
		}
		const stage = process.env.stage as string;

		const filter_ERC20 = {
			and: [
				{ eq: ['to', '0xc84a0d2c58adb68E61400E702762c116d2915317'] },
				{ eq: ['to', '0x95161f5681eF4292eA62F4eE4Bb3CC2e1EB7b284'] },
			],
		};

		const stream = {
			chains: [EvmChain.POLYGON],
			description: `monitor all user wallets usdt in ${stage}`,
			tag: `userWalletsUsdt-${stage}`,
			abi: contractAbi,
			includeContractLogs: true,
			allAddresses: true,
			topic0: ['Transfer(address,address,uint256)'],
			advancedOptions: [
				{
					topic0: 'transfer(address,address,uint256)',
					filter: filter_ERC20,
				},
			],
			webhookUrl: 'https://webhook.site/a3618227-e317-44d6-a60d-7548cf75ce82',
			includeNativeTxs: true,
		};
		const newStream = await Moralis.Streams.add(stream);
		const { id } = newStream.toJSON();
		console.log({ streamId: id });

		const dynamo = new AWS.DynamoDB.DocumentClient();

		const TableName = process.env.dynamo_table as string;

		await dynamo
			.put({
				TableName,
				Item: {
					[TableKeys.PK]: Entities.WALLETS_STREAM_USDT,
					[TableKeys.SK]: Entities.WALLETS_STREAM_USDT,
					[WalletsStreamAttributes.ID]: id,
				},
				ConditionExpression: `attribute_not_exists(${TableKeys.PK})`,
			})
			.promise();

		return id;
	}

	async addWalletToStream(address: string, streamId: string) {
		await Moralis.Streams.addAddress({ address, id: streamId });
	}

	async getWalletsStreamMaticId() {
		const dynamo = new AWS.DynamoDB.DocumentClient();

		const TableName = process.env.dynamo_table as string;

		const output = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.WALLETS_STREAM_MATIC,
					[TableKeys.SK]: Entities.WALLETS_STREAM_MATIC,
				},
			})
			.promise();

		if (output.Item) {
			const walletsStreamItem = output.Item as WalletsStreamItem;
			return walletsStreamItem[WalletsStreamAttributes.ID];
		}
	}

	async getWalletsStreamUsdtId() {
		const dynamo = new AWS.DynamoDB.DocumentClient();

		const TableName = process.env.dynamo_table as string;

		const output = await dynamo
			.get({
				TableName,
				Key: {
					[TableKeys.PK]: Entities.WALLETS_STREAM_USDT,
					[TableKeys.SK]: Entities.WALLETS_STREAM_USDT,
				},
			})
			.promise();

		if (output.Item) {
			const walletsStreamItem = output.Item as WalletsStreamItem;
			return walletsStreamItem[WalletsStreamAttributes.ID];
		}
	}
}
