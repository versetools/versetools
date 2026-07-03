import type { ReturnResult } from "@l3dev/result";

import type { EmailTemplate } from "../EmailTemplate";

export type SendEmailAddresses = {
	from: string;
	fromDisplayName?: string;
	to: string;
};

export type SendBulkEmailAddresses<T> = {
	from: string;
	fromDisplayName?: string;
	to: (
		| string
		| {
				address: string;
				templateData?: T;
		  }
	)[];
};

export interface EmailSenderAdapterInterface {
	sendEmail(
		addresses: SendEmailAddresses,
		template: EmailTemplate<any>
	): Promise<ReturnResult<any, any>>;
	sendBulkEmail<T>(
		addresses: SendBulkEmailAddresses<NoInfer<T>>,
		template: EmailTemplate<T>
	): Promise<ReturnResult<any, any>>;
}
