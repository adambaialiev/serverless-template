import { APIGatewayProxyHandler } from 'aws-lambda';
import { FeedbackService } from '@/services/feedback/feedbackService';
import { sendResponse } from '@/utils/makeResponse';
import axios from "axios";

const feedbackService = new FeedbackService();

const slackUrl = process.env.SLACK_FEEDBACK_URL as string;

const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const { comment, rating } = JSON.parse(event.body);

		const response = await feedbackService.create(comment, rating);

		await axios.post(
			slackUrl,
			{
				text: `Endpoint feedback has been executed.\nComment: ${comment}.\nRating: ${rating}.`
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
