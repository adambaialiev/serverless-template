import axios from 'axios';

type SlackVarType =
	| 'SLACK_GET_BALANCES_URL'
	| 'SLACK_UPDATE_PRICES_URL'
	| 'SLACK_MAKE_TRANSACTION_URL'
	| 'SLACK_GET_TRANSACTION_URL'
	| 'SLACK_CREATE_WALLET_URL'
	| 'SLACK_FEEDBACK_URL'
	| 'SLACK_SUPPORT_URL';

export class SlackNotifications {
	static async sendMessage(variable: SlackVarType, text: string) {
		try {
			const slackUrl =
				process.env[`${process.env.stage.toUpperCase()}_${variable}`];

			await axios.post(slackUrl, { text });
		} catch (error) {
			if (error instanceof Error) {
				console.log({ error });
			}
		}
	}
}
