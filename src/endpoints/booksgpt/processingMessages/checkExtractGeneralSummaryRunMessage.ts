import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	runId: string;
	assistantId: string;
	threadId: string;
};

export const checkExtractGeneralSummaryRunMessage = ({
	runId,
	assistantId,
	threadId,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.checkExtractGeneralSummaryRun,
		DelaySeconds: 60,
		MessageAttributes: {
			runId: {
				DataType: 'String',
				StringValue: runId,
			},
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
			threadId: {
				DataType: 'String',
				StringValue: threadId,
			},
		},
	};
};
