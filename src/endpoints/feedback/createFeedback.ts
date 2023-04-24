import { APIGatewayProxyHandler } from 'aws-lambda';
import { FeedbackService } from '@/services/feedback/feedbackService';
import { sendResponse } from '@/utils/makeResponse';
import axios from "axios";

const feedbackService = new FeedbackService();

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const { comment, rating } = JSON.parse(event.body);

		const response = await feedbackService.create(comment, rating);

		await axios.post(
			'https://hooks.slack.com/services/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',
			{
				text: `Comment: ${comment}\n Rating: ${rating}`
			})

		return sendResponse(201, response);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const createFeedback = handler;
