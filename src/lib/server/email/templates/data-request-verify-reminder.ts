import type { EmailTemplateContent, Template } from "@aws-sdk/client-sesv2";

import { config } from "$lib/config";

type DataRequestVerifyReminderParams = {
	version: "subject" | "third-party";
	verificationUrl: string;
};

const subjectTemplateContent: EmailTemplateContent = {
	Subject: "Reminder: Privacy Request: Verify your email",
	Html: `<p>Hi,</p>
<p>Thanks again for contacting us!</p>
<p>Please verify your email address by following this link:</p>
<p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
<p>This is our final attempt to verify your email. You are receiving this email because someone submitted a privacy request for this email address.</p>
<p>In order to process the request and safeguard your data, you must verify your email address by clicking the link above.</p>
<p>If you don't recognise this request, you can safely ignore this email.</p>
<p>Thanks,</p>
<p>${config.name} Privacy</p>`
};

const thirdPartyTemplateContent: EmailTemplateContent = {
	Subject: "Reminder: Privacy Request: Verify your email",
	Html: `<p>Hi,</p>
<p>Thanks again for contacting us!</p>
<p>Please verify your email address by following this link:</p>
<p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
<p>This is our final attempt to verify your email. You are receiving this email because you submitted a privacy request on behalf of someone else.</p>
<p>In order to process the request and safeguard the subject's data, you must verify your email address by clicking the link above.</p>
<p>If you didn't submit this request, you can safely ignore this email.</p>
<p>Thanks,</p>
<p>${config.name} Privacy</p>`
};

export function dataRequestVerifyReminder({
	version,
	verificationUrl
}: DataRequestVerifyReminderParams): Template {
	return {
		TemplateContent: version === "subject" ? subjectTemplateContent : thirdPartyTemplateContent,
		TemplateData: JSON.stringify({ verificationUrl })
	};
}
