import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	assistantId: string;
	chapter: string;
	index: string;
	apiKey: string;
};

export const extractChapterSummaryMessage = ({
	assistantId,
	chapter,
	index,
	apiKey,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.extractChapterSummary,
		MessageAttributes: {
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
			chapter: {
				DataType: 'String',
				StringValue: chapter,
			},
			index: {
				DataType: 'String',
				StringValue: index,
			},
			apiKey: {
				DataType: 'String',
				StringValue: apiKey,
			},
		},
	};
};
