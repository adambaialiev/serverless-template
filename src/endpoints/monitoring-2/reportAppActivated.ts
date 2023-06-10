import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import { ReportAppActivatedPayload } from '@/services/monitoring-2/monitoringService';
import { SlackNotifications } from '@/utils/slackNotifications';

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		console.log({ event });
		const payload = JSON.parse(event.body) as ReportAppActivatedPayload;
		const sourceCountryCode = event.headers[
			'CloudFront-Viewer-Country'
		] as string;

		await SlackNotifications.sendMessage(
			'monitoring',
			'SLACK_MONITORING_URL',
			sourceCountryCode,
			JSON.stringify({ ...payload, event: 'APP_ACTIVATED' }, null, '\t')
		);

		return sendResponse(201, true);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const reportAppActivated = handler;
