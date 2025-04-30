import type { EmailTemplateContent, Template } from "@aws-sdk/client-sesv2";

import { config } from "$lib/config";

type DataRequestVerifyParams = {
	version: "subject" | "third-party";
	verificationLink: string;
};

const subjectTemplateContent: EmailTemplateContent = {
	Subject: "Privacy Request: Verify your email",
	Html: `<p>Hi,</p>
<p>Thanks for contacting us!</p>
<p>You are receiving this email because someone submitted a privacy request for this email address. In order to process the request and safeguard your data, you must verify your email address by clicking the link below.</p>
<p>Please verify your email address by following this link:</p>
<p><a href="{{verificationLink}}">{{verificationLink}}</a></p>
<p>If you don't recognise this request, you can safely ignore this email.</p>
<p>Thanks,</p>
<p>${config.name} Privacy</p>`
};

const thirdPartyTemplateContent: EmailTemplateContent = {
	Subject: "Privacy Request: Verify your email",
	Html: `<p>Hi,</p>
<p>Thanks for contacting us!</p>
<p>You are receiving this email because you submitted a privacy request on behalf of someone else. In order to process the request and safeguard the subject's data, you must verify your email address by clicking the link below.</p>
<p>Please verify your email address by following this link:</p>
<p><a href="{{verificationLink}}">{{verificationLink}}</a></p>
<p>If you didn't submit this request, you can safely ignore this email.</p>
<p>Thanks,</p>
<p>${config.name} Privacy</p>`
};

export function dataRequestVerify({
	version,
	verificationLink
}: DataRequestVerifyParams): Template {
	return {
		TemplateContent: version === "subject" ? subjectTemplateContent : thirdPartyTemplateContent,
		TemplateData: JSON.stringify({ verificationLink })
	};
}
