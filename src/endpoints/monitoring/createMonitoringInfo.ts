import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import MonitoringService from '@/services/monitoring/monitoringService';
import { SlackNotifications } from '@/utils/slackNotifications';
import { getName } from 'country-list';

const monitoring = new MonitoringService();

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		console.log({ event });
		const { eventName, coin, metaData } = JSON.parse(event.body);
		const sourceCountryCode = event.headers[
			'CloudFront-Viewer-Country'
		] as string;
		const country = getName(sourceCountryCode);

		const postData = {
			eventName,
			coin,
			metaData: { ...metaData, country },
		};

		const response = await monitoring.create(postData);

		await SlackNotifications.sendMessage(
			'monitoring',
			'SLACK_MONITORING_URL',
			sourceCountryCode,
			`Balances: ${postData}`
		);

		return sendResponse(201, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const createMonitoringInfo = handler;
