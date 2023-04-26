import axios from 'axios';
import { getEmojiFlag } from 'countries-list';
import { getName } from 'country-list';

type SlackVarType =
	| 'SLACK_GET_BALANCES_URL'
	| 'SLACK_UPDATE_PRICES_URL'
	| 'SLACK_MAKE_TRANSACTION_URL'
	| 'SLACK_GET_TRANSACTION_URL'
	| 'SLACK_CREATE_WALLET_URL'
	| 'SLACK_FEEDBACK_URL'
	| 'SLACK_SUPPORT_URL';

export class SlackNotifications {
	static async sendMessage(
		name: string,
		target: SlackVarType,
		countryCode: string,
		data?: string
	) {
		try {
			const sourceCountryFlag = getEmojiFlag(countryCode);
			const sourceCountryName = getName(countryCode);

			const slackUrl =
				process.env[`${process.env.stage.toUpperCase()}_${target}`];

			const message = `Endpoint ${name} has been executed from country - ${sourceCountryFlag}${sourceCountryName}.\n${data}`;

			await axios.post(slackUrl, { text: message });
		} catch (error) {
			if (error instanceof Error) {
				console.log({ error });
			}
		}
	}
}
