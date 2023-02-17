import { WithdrawalTransactionItem } from '@/common/dynamo/schema';
import { getAllWalletsAddresses } from '@/services/user/getAllWalletsAddresses';
import Pusher from 'pusher';

export default class PusherService {
	constructor() {
		this.pusher = new Pusher({
			appId: '1553323',
			key: '0efe598716d1079e47c2',
			secret: 'c76c9fb5badc1b034bf2',
			cluster: 'mt1',
			useTLS: true,
		});
	}

	pusher: Pusher;

	async triggerUsersWalletsUpdated() {
		const wallets = await getAllWalletsAddresses();
		await this.pusher.trigger('mutations', 'usersWalletsUpdated', wallets);
	}

	async triggerWithdrawalPendingTransactionsUpdated(
		transactions: WithdrawalTransactionItem[]
	) {
		await this.pusher.trigger(
			'mutations',
			'withdrawalPendingTransactionsUpdated',
			transactions
		);
	}
}
