import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	runId: string;
	assistantId: string;
	threadId: string;
	uid: string;
	openAiAssistantId: string;
};

export const checkExtractChaptersListRunMessage = ({
	runId,
	assistantId,
	threadId,
	uid,
	openAiAssistantId,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.checkExtractChaptersListRun,
		MessageGroupId: 'checkExtractChaptersListRun',
		MessageDeduplicationId: runId,
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
			openAiAssistantId: {
				DataType: 'String',
				StringValue: openAiAssistantId,
			},
		},
	};
};
