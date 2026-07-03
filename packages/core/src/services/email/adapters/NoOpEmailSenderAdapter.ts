import { NONE } from "@l3dev/result";

import type {
	EmailSenderAdapterInterface,
	SendBulkEmailAddresses,
	SendEmailAddresses
} from "./EmailSenderAdapterInterface";
import type { EmailTemplate } from "../EmailTemplate";

export default class NoOpEmailSenderAdapter implements EmailSenderAdapterInterface {
	async sendEmail(_addresses: SendEmailAddresses, _template: EmailTemplate<any>) {
		return NONE;
	}

	async sendBulkEmail<T>(
		_addresses: SendBulkEmailAddresses<NoInfer<T>>,
		_template: EmailTemplate<T>
	) {
		return NONE;
	}
}
