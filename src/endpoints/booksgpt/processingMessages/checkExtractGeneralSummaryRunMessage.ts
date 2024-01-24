import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	runId: string;
	assistantId: string;
	threadId: string;
	uid: string;
};

export const checkExtractGeneralSummaryRunMessage = ({
	runId,
	assistantId,
	threadId,
	uid,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.checkExtractGeneralSummaryRun,
		DelaySeconds: 40,
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
			uid: {
				DataType: 'String',
				StringValue: uid,
			},
		},
	};
};
