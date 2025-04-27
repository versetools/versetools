import { SendEmailCommand, SendBulkEmailCommand, type Template } from "@aws-sdk/client-sesv2";
import { Result } from "@versetools/result";

import { config } from "$lib/config";

import { client } from "./client";

export * from "./client";
export * from "./templates";

type SendEmailParams = {
	from: keyof typeof config.emails | (string & {});
	fromDisplayName?: string;
	to: string;
} & (
	| {
			subject: string;
			body: {
				type: "html" | "text";
				content: string;
			};
	  }
	| {
			template: Template;
	  }
);

export function sendEmail(params: SendEmailParams) {
	const from = config.emails[params.from as keyof typeof config.emails] ?? params.from;

	const command = new SendEmailCommand({
		FromEmailAddress: params.fromDisplayName ? `"${params.fromDisplayName}" <${from}>` : from,
		Destination: {
			ToAddresses: [params.to]
		},
		Content:
			"template" in params
				? {
						Template: params.template
					}
				: {
						Simple: {
							Subject: {
								Data: params.subject
							},
							Body:
								params.body.type === "html"
									? {
											Html: {
												Data: params.body.content
											}
										}
									: {
											Text: {
												Data: params.body.content
											}
										}
						}
					}
	});

	return Result.fromPromise({ onError: { type: "SEND_EMAIL_FAILED" } }, client.send(command));
}

type SendBulkEmailParams = {
	from: keyof typeof config.emails | (string & {});
	fromDisplayName?: string;
} & (
	| {
			to: string[];
			subject: string;
			body: {
				type: "html" | "text";
				content: string;
			};
	  }
	| {
			to: {
				address: string;
				templateData: Record<string, string>;
			}[];
			template: Template;
	  }
);

export function sendBulkEmail(params: SendBulkEmailParams) {
	const from = config.emails[params.from as keyof typeof config.emails] ?? params.from;

	const command = new SendBulkEmailCommand({
		FromEmailAddress: params.fromDisplayName ? `"${params.fromDisplayName}" <${from}>` : from,
		BulkEmailEntries:
			"template" in params
				? params.to.map(({ address, templateData }) => ({
						Destination: {
							ToAddresses: [address]
						},
						ReplacementEmailContent: {
							ReplacementTemplate: {
								ReplacementTemplateData: JSON.stringify(templateData)
							}
						}
					}))
				: params.to.map((address) => ({
						Destination: {
							ToAddresses: [address]
						}
					})),
		DefaultContent: {
			Template:
				"template" in params
					? params.template
					: {
							TemplateContent: {
								Subject: params.subject,
								...(params.body.type === "html"
									? {
											Html: params.body.content
										}
									: {
											Text: params.body.content
										})
							}
						}
		}
	});

	return Result.fromPromise({ onError: { type: "BULK_SEND_EMAIL_FAILED" } }, client.send(command));
}
