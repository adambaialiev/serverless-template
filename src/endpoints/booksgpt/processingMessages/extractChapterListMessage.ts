import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	openAiAssistantId: string;
	assistantId: string;
	uid: string;
};

export const extractChapterListMessage = ({
	openAiAssistantId,
	assistantId,
	uid,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.extractChaptersList,
		DelaySeconds: 60,
		MessageAttributes: {
			openAiAssistantId: {
				DataType: 'String',
				StringValue: openAiAssistantId,
			},
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
			uid: {
				DataType: 'String',
				StringValue: uid,
			},
		},
	};
};
