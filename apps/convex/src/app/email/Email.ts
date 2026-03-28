import {
	SendBulkEmailCommand,
	SendEmailCommand,
	SESv2Client,
	type BulkEmailEntry
} from "@aws-sdk/client-sesv2";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Result } from "@l3dev/result";
import { config } from "@versetools/core/config";

import type { EmailTemplate } from "./templates/EmailTemplate";

type CredentialsConfig = {
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
};

type SendEmailAddresses = {
	from: keyof typeof config.emails | (string & {});
	fromDisplayName?: string;
	to: string;
};

type SendBulkEmailAddresses<T> = {
	from: keyof typeof config.emails | (string & {});
	fromDisplayName?: string;
	to: (
		| string
		| {
				address: string;
				templateData?: T;
		  }
	)[];
};

export class Email {
	private sesClient: SESv2Client;
	private sqsClient: SQSClient;

	constructor(config: CredentialsConfig) {
		this.sesClient = new SESv2Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey
			}
		});

		this.sqsClient = new SQSClient({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey
			}
		});
	}

	sendEmail(addresses: SendEmailAddresses, template: EmailTemplate<any>) {
		const from = config.emails[addresses.from as keyof typeof config.emails] ?? addresses.from;

		const command = new SendEmailCommand({
			FromEmailAddress: addresses.fromDisplayName
				? `"${addresses.fromDisplayName}" <${from}>`
				: from,
			Destination: {
				ToAddresses: [addresses.to]
			},
			Content: {
				Template: template.serialize()
			}
		});

		return Result.fromPromise(this.sesClient.send(command), {
			onError: { type: "SEND_EMAIL" }
		});
	}

	sendBulkEmail<T>(addresses: SendBulkEmailAddresses<NoInfer<T>>, template: EmailTemplate<T>) {
		const from = config.emails[addresses.from as keyof typeof config.emails] ?? addresses.from;

		const command = new SendBulkEmailCommand({
			FromEmailAddress: addresses.fromDisplayName
				? `"${addresses.fromDisplayName}" <${from}>`
				: from,
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
				Template: template.serialize()
			}
		});

		return Result.fromPromise(this.sesClient.send(command), {
			onError: { type: "BULK_SEND_EMAIL" }
		});
	}
}
