import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	assistantId: string;
	apiKey: string;
};

export const extractChapterListMessage = ({
	assistantId,
	apiKey,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.extractChaptersList,
		DelaySeconds: 60,
		MessageAttributes: {
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
			apiKey: {
				DataType: 'String',
				StringValue: apiKey,
			},
		},
	};
};