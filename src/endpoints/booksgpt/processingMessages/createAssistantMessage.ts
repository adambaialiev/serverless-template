import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type CreateAssistantMessageParams = {
	name: string;
	author: string;
	pdfKey: string;
	coverImageKey: string;
	uid: string;
	assistantId: string;
};

export const createAssistantMessage = ({
	name,
	author,
	pdfKey,
	coverImageKey,
	uid,
	assistantId,
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
			pdfKey: {
				DataType: 'String',
				StringValue: pdfKey,
			},
			coverImageKey: {
				DataType: 'String',
				StringValue: coverImageKey,
			},
			uid: {
				DataType: 'String',
				StringValue: uid,
			},
			assistantId: {
				DataType: 'String',
				StringValue: assistantId,
			},
		},
	};
};
