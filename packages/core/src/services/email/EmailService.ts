import {
	type EmailSenderAdapterInterface,
	type SendBulkEmailAddresses,
	type SendEmailAddresses
} from "./adapters/EmailSenderAdapterInterface";
import type { EmailTemplate } from "./EmailTemplate";

export default class EmailService {
	constructor(private sender: EmailSenderAdapterInterface) {}

	sendEmail(addresses: SendEmailAddresses, template: EmailTemplate<any>) {
		return this.sender.sendEmail(addresses, template);
	}

	sendBulkEmail<T>(addresses: SendBulkEmailAddresses<NoInfer<T>>, template: EmailTemplate<T>) {
		return this.sender.sendBulkEmail(addresses, template);
	}
}
