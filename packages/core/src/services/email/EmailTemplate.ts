export type EmailTemplateContent = {
	Subject?: string | undefined;
	Text?: string | undefined;
	Html?: string | undefined;
};

export abstract class EmailTemplate<T> {
	protected data: T;

	constructor(...[data]: {} extends T ? [data?: {}] : [data: T]) {
		this.data = data ?? ({} as T);
	}

	public getData(): any {
		return this.data;
	}

	public abstract getContent(): EmailTemplateContent;
}
