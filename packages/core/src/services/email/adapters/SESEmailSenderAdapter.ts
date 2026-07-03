import {
	SendBulkEmailCommand,
	SendEmailCommand,
	SESv2Client,
	type BulkEmailEntry,
	type Template
} from "@aws-sdk/client-sesv2";
import { Result } from "@l3dev/result";

import type {
	EmailSenderAdapterInterface,
	SendBulkEmailAddresses,
	SendEmailAddresses
} from "./EmailSenderAdapterInterface";
import type { EmailTemplate } from "../EmailTemplate";

export default class SESEmailSenderAdapter implements EmailSenderAdapterInterface {
	constructor(private readonly client: SESv2Client) {}

	sendEmail(addresses: SendEmailAddresses, template: EmailTemplate<any>) {
		const command = new SendEmailCommand({
			FromEmailAddress: addresses.fromDisplayName
				? `"${addresses.fromDisplayName}" <${addresses.from}>`
				: addresses.from,
			Destination: {
				ToAddresses: [addresses.to]
			},
			Content: {
				Template: this.serializeTemplate(template)
			}
		});

		return Result.fromPromise(this.client.send(command), {
			onError: { type: "SEND_EMAIL" }
		});
	}

	sendBulkEmail<T>(addresses: SendBulkEmailAddresses<NoInfer<T>>, template: EmailTemplate<T>) {
		const command = new SendBulkEmailCommand({
			FromEmailAddress: addresses.fromDisplayName
				? `"${addresses.fromDisplayName}" <${addresses.from}>`
				: addresses.from,
			BulkEmailEntries: addresses.to.map((address) => {
				const entry: BulkEmailEntry = {
					Destination: {
						ToAddresses: [typeof address === "string" ? address : address.address]
					}
				};

				if (typeof address !== "string" && "templateData" in address) {
					entry.ReplacementEmailContent = {
						ReplacementTemplate: {
							ReplacementTemplateData: JSON.stringify(address.templateData)
						}
					};
				}

				return entry;
			}),
			DefaultContent: {
				Template: this.serializeTemplate(template)
			}
		});

		return Result.fromPromise(this.client.send(command), {
			onError: { type: "BULK_SEND_EMAIL" }
		});
	}

	protected serializeTemplate(template: EmailTemplate<any>) {
		return {
			TemplateContent: template.getContent(),
			TemplateData: JSON.stringify(template.getData())
		} satisfies Template;
	}
}
