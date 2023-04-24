import { APIGatewayProxyHandler } from 'aws-lambda';
import { CustomAPIGateway } from '@/middlewares/withAuthorization';
import { sendResponse } from '@/utils/makeResponse';
import AWS from 'aws-sdk';
import {
	Entities,
	SupportTicketAttributes,
	TableKeys,
} from '@/common/dynamo/schema';
import { v4 } from 'uuid';
import { buildSupportTicketKey } from '@/common/dynamo/buildKey';
import axios from "axios";

const dynamo = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.dynamo_table as string;

const handler: APIGatewayProxyHandler = async (event: CustomAPIGateway) => {
	try {
		const { description, email } = JSON.parse(event.body);
		const feedbackId = v4();
		const date = Date.now().toString();
		const Item = {
			[TableKeys.PK]: Entities.SUPPORT_TICKET,
			[TableKeys.SK]: buildSupportTicketKey(feedbackId),
			[SupportTicketAttributes.ID]: feedbackId,
			[SupportTicketAttributes.CREATED_AT]: date,
			[SupportTicketAttributes.UPDATED_AT]: date,
			[SupportTicketAttributes.DESCRIPTION]: description,
			[SupportTicketAttributes.EMAIL]: email,
			[SupportTicketAttributes.IS_RESOLVED]: false,
		};

		await dynamo
			.put({
				Item,
				TableName,
				ConditionExpression: `attribute_not_exists(${TableKeys.SK})`,
			})
			.promise();

		await axios.post(
            'https://hooks.slack.com/services/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',
            {
				text: `Email: ${email}\n Description: ${description}`
			})

		return sendResponse(201, true);
	} catch (error: unknown) {
		console.log(error);
		if (error instanceof Error) {
			return sendResponse(500, error.message);
		}
	}
};

export const createSupportTicket = handler;
