import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import MonitoringService, {
	MonitoringPayload,
} from '@/services/monitoring-2/monitoringService';
import { SlackNotifications } from '@/utils/slackNotifications';
import { getName } from 'country-list';

const monitoring = new MonitoringService();

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		console.log({ event });
		const payload = JSON.parse(event.body) as MonitoringPayload;
		const sourceCountryCode = event.headers[
			'CloudFront-Viewer-Country'
		] as string;
		const country = getName(sourceCountryCode);

		const response = await monitoring.create(country, payload);

		await SlackNotifications.sendMessage(
			'monitoring',
			'SLACK_MONITORING_URL',
			sourceCountryCode,
			JSON.stringify(payload, null, '\t')
		);

		return sendResponse(201, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const reportMonitoringEvents = handler;
