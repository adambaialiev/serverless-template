import { UserSlug } from '../user/types';

export interface ITransactionCreateParams {
	source: UserSlug;
	target: UserSlug;
	amount: number;
	comment?: string;
}
