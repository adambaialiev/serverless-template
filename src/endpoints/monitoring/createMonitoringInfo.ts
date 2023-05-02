import { APIGatewayProxyHandler } from 'aws-lambda';
import { sendResponse } from '@/utils/makeResponse';
import MonitoringService from '@/services/monitoring/monitoringService';

const monitoring = new MonitoringService();

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		console.log({ event });
		const { eventName, metaData } = JSON.parse(event.body);

		const response = await monitoring.create({ eventName, metaData });

		return sendResponse(201, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const createMonitoringInfo = handler;
