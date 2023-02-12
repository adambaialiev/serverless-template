import { MasterWalletInvolvedTransactionItem } from '@/common/dynamo/schema';
import { IWallet } from '@/services/user/types';
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

	triggerUsersWalletsUpdated(wallets: IWallet[]) {
		this.pusher.trigger('mutations', 'usersWalletsUpdated', wallets);
	}

	triggerTouchPendingTransactionsUpdated(
		transactions: MasterWalletInvolvedTransactionItem[]
	) {
		this.pusher.trigger(
			'mutations',
			'touchPendingTransactionsUpdated',
			transactions
		);
	}

	triggerHomePendingTransactionsUpdated(
		transactions: MasterWalletInvolvedTransactionItem[]
	) {
		this.pusher.trigger(
			'mutations',
			'homePendingTransactionsUpdated',
			transactions
		);
	}

	triggerWithdrawalPendingTransactionsUpdated(
		transactions: MasterWalletInvolvedTransactionItem[]
	) {
		this.pusher.trigger(
			'mutations',
			'withdrawalPendingTransactionsUpdated',
			transactions
		);
	}
}
