import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	assistantId: string;
};

export const extractGeneralSummaryMessage = ({
	assistantId,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.extractGeneralSummary,
		MessageAttributes: {
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
		},
	};
};
