import type { Err } from "@l3dev/result";
import { isPermissionErr, defaultMessages, type MessageData } from "@versetools/core/errors";
import { toast } from "@versetools/ui";

export function toastResultError<TType extends PropertyKey>(
	err: Err<TType, any>,
	genericMessage: string,
	messages: {
		[type in TType | keyof typeof defaultMessages]?: Partial<MessageData>;
	} = {}
) {
	let type = err.type;
	if (type === "CAPTCHA_CLOSED") {
		return;
	}

	if (isPermissionErr(err)) {
		type = "MISSING_PERMISSION" as TType;
	}

	const messageOrGetter = defaultMessages[type as keyof typeof defaultMessages] ?? null;
	if (messageOrGetter) {
		const message = typeof messageOrGetter === "function" ? messageOrGetter(err) : messageOrGetter;
		const overrideMessage = messages[type] ?? {};
		toast({
			variant: "destructive",
			...message,
			...overrideMessage
		});
		return;
	}

	console.error(err);
	toast({
		variant: "destructive",
		title: genericMessage,
		description: String(err.type)
	});
}
