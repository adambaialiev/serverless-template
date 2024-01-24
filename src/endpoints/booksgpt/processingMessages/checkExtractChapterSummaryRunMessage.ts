import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type CreateAssistantMessageParams = {
	runId: string;
	assistantId: string;
	threadId: string;
	index: string;
	uid: string;
};

export const checkExtractChapterSummaryRunMessage = ({
	runId,
	assistantId,
	threadId,
	uid,
	index,
}: CreateAssistantMessageParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.checkExtractChapterSummaryRun,
		MessageGroupId: 'checkExtractChapterSummaryRun',
		MessageDeduplicationId: assistantId,
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
			index: {
				DataType: 'String',
				StringValue: index,
			},
		},
	};
};
