import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

const API_KEY =
	'0EXNGD2YqLuJYK6F5mCRcDn3klUCUaB2le8fQ0n2A07htR2lhucamxpiFOCk9lhK';

Moralis.start({
	apiKey: API_KEY,
});

export default class CryptoStreams {
	async createMasterWalletStream() {
		const stream = {
			chains: [EvmChain.POLYGON], // list of blockchains to monitor
			description: 'monitor master wallet', // your description
			tag: 'masterWallet', // give it a tag
			webhookUrl: 'https://webhook.site/a3618227-e317-44d6-a60d-7548cf75ce82', // webhook url to receive events,
			includeNativeTxs: true,
		};
		const newStream = await Moralis.Streams.add(stream);
		const { id } = newStream.toJSON();
		console.log({ streamId: id });
		//save stream id to dynamodb
		await Moralis.Streams.addAddress({
			address: '0xc84a0d2c58adb68E61400E702762c116d2915317',
			id,
		});
	}

	async addWalletToStream() {
		const address = '0x68b3f12d6e8d85a8d3dbbc15bba9dc5103b888a4';
		const id = '';
		// get id of stream from dynamodb
		await Moralis.Streams.addAddress({ address, id });
	}
}
