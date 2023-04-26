import { APIGatewayProxyHandler } from 'aws-lambda';
import { FeedbackService } from '@/services/feedback/feedbackService';
import { sendResponse } from '@/utils/makeResponse';
import { SlackNotifications } from '@/utils/slackNotifications';

const feedbackService = new FeedbackService();

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const { comment, rating } = JSON.parse(event.body);

		const response = await feedbackService.create(comment, rating);

		const sourceCountryCode = event.headers['CloudFront-Viewer-Country'];
		await SlackNotifications.sendMessage(
			'feedback',
			'SLACK_FEEDBACK_URL',
			sourceCountryCode,
			`Comment: ${comment}.\nRating: ${rating}.`
		);

		return sendResponse(201, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const createFeedback = handler;
