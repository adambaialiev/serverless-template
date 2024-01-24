import { SQS } from 'aws-sdk';
import { EProcessingMessageTypes } from './types';

type TParams = {
	name: string;
	author: string;
	uid: string;
	assistantId: string;
	pdfKey: string;
};

export const uploadPdfMessage = ({
	name,
	author,
	uid,
	assistantId,
	pdfKey,
}: TParams): SQS.Types.SendMessageRequest => {
	return {
		QueueUrl: process.env.MAIN_QUEUE_URL,
		MessageBody: EProcessingMessageTypes.uploadPdf,
		MessageGroupId: 'uploadPdf',
		MessageDeduplicationId: pdfKey,
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
			pdfKey: {
				DataType: 'String',
				StringValue: pdfKey,
			},
		},
	};
};
