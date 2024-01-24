import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	openAiAssistantId: string;
	assistantId: string;
	chapter: string;
	index: string;
	uid: string;
};

export const extractChapterSummaryMessage = ({
	openAiAssistantId,
	assistantId,
	chapter,
	index,
	uid,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.extractChapterSummary,
		MessageGroupId: 'extractChapterSummary',
		MessageDeduplicationId: assistantId,
		MessageAttributes: {
			openAiAssistantId: {
				DataType: 'String',
				StringValue: openAiAssistantId,
			},
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
			uid: {
				DataType: 'String',
				StringValue: uid,
			},
		},
	};
};
