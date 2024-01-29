import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	assistantId: string;
};

export const extractChapterListMessage = ({
	assistantId,
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
		},
	};
};
