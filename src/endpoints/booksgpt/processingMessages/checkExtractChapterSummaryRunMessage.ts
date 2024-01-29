import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type CreateAssistantMessageParams = {
	runId: string;
	assistantId: string;
	threadId: string;
	index: string;
};

export const checkExtractChapterSummaryRunMessage = ({
	runId,
	assistantId,
	threadId,
	index,
}: CreateAssistantMessageParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.checkExtractChapterSummaryRun,
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
			index: {
				DataType: 'String',
				StringValue: index,
			},
		},
	};
};
