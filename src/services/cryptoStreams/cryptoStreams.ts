import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';
import MasterWallet from '@/services/masterWallet/masterWallet';

const API_KEY =
	'0EXNGD2YqLuJYK6F5mCRcDn3klUCUaB2le8fQ0n2A07htR2lhucamxpiFOCk9lhK';

Moralis.start({
	apiKey: API_KEY,
});

const stageToMasterWalletAddress: { [key: string]: string } = {
	'wallet-adam-dev': '0xc84a0d2c58adb68E61400E702762c116d2915317',
};

export default class CryptoStreams {
	async createMasterWalletStream() {
		const stage = process.env.stage as string;
		const stream = {
			chains: [EvmChain.POLYGON],
			description: `monitor master wallet ${stage}`,
			tag: `masterWallet${stage}`,
			webhookUrl: 'https://webhook.site/a3618227-e317-44d6-a60d-7548cf75ce82',
			includeNativeTxs: true,
		};
		const newStream = await Moralis.Streams.add(stream);
		const { id } = newStream.toJSON();
		console.log({ streamId: id });
		//save stream id to dynamodb
		await Moralis.Streams.addAddress({
			address: stageToMasterWalletAddress[stage],
			id,
		});
		return id;
	}

	async addWalletToStream(address: string) {
		const masterWalletService = new MasterWallet();
		const { streamId } = await masterWalletService.getMasterWallet();

		if (streamId) {
			await Moralis.Streams.addAddress({ address, id: streamId });
		}
	}
}
