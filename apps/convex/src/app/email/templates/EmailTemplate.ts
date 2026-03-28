import type { EmailTemplateContent, Template } from "@aws-sdk/client-sesv2";

export abstract class EmailTemplate<T> {
	protected data: T;

	constructor(...[data]: {} extends T ? [data?: {}] : [data: T]) {
		this.data = data ?? ({} as T);
	}

	protected abstract getTemplateContent(): EmailTemplateContent;

	serialize(): Template {
		return {
			TemplateContent: this.getTemplateContent(),
			TemplateData: JSON.stringify(this.data)
		};
	}
}
