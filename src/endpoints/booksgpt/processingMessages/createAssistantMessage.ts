import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type CreateAssistantMessageParams = {
	name: string;
	author: string;
	uid: string;
	assistantId: string;
	fileId: string;
};

export const createAssistantMessage = ({
	name,
	author,
	uid,
	assistantId,
	fileId,
}: CreateAssistantMessageParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.createAssistant,
		MessageAttributes: {
			name: {
				DataType: 'String',
				StringValue: name,
			},
			author: {
				DataType: 'String',
				StringValue: author,
			},
			uid: {
				DataType: 'String',
				StringValue: uid,
			},
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
			fileId: {
				DataType: 'String',
				StringValue: fileId,
			},
		},
	};
};
