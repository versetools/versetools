import type { EmailTemplateContent, Template } from "@aws-sdk/client-sesv2";

import { config } from "$lib/config";

type DataRequestVerifyEmailParams = {
	version: "subject" | "third-party";
	verificationLink: string;
};

const subjectTemplateContent: EmailTemplateContent = {
	Subject: "Privacy Request: Verify your email",
	Html: `<p>Hi,</p>
<p>Thanks for contacting us!</p>
<p>You are receiving this email because someone submitted a data subject access request (SAR) for this email address. In order to process the request and safeguard your data, you must verify your email address by clicking the link below.</p>
<p>Please verify your email address by following this link:</p>
<p><a href="{{verificationLink}}">{{verificationLink}}</a></p>
<p>If you didn't submit this request, you can safely ignore this email.</p>
<p>Thanks,</p>
<p>${config.name} Privacy</p>`
};

const thirdPartyTemplateContent: EmailTemplateContent = {
	Subject: "Privacy Request: Verify your email",
	Html: `<p>Hi,</p>
<p>Thanks for contacting us!</p>
<p>You are receiving this email because you submitted a data subject access request (SAR) on behalf of someone else. In order to process the request and safeguard the subject's data, you must verify your email address by clicking the link below.</p>
<p>Please verify your email address by following this link:</p>
<p><a href="{{verificationLink}}">{{verificationLink}}</a></p>
<p>If you didn't submit this request, you can safely ignore this email.</p>
<p>Thanks,</p>
<p>${config.name} Privacy</p>`
};

export function dataRequestVerifyEmail({
	version,
	verificationLink
}: DataRequestVerifyEmailParams): Template {
	return {
		TemplateContent: version === "subject" ? subjectTemplateContent : thirdPartyTemplateContent,
		TemplateData: JSON.stringify({ verificationLink })
	};
}
