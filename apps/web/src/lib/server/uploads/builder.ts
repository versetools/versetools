import type { RequestEvent } from "@sveltejs/kit";
import type { Json } from "@uploadthing/shared";
import { createBuilder } from "uploadthing/server";
import * as z from "zod/v4";

type AdapterArgs = {
	req: RequestEvent;
};

function formatZodError(err: z.ZodError) {
	return err.flatten();
}

export const uploadthing = createBuilder<
	AdapterArgs,
	{
		type?: string | null;
		message?: string;
		zodError?: ReturnType<typeof formatZodError> | null;
		missingPermission?: string;
		[key: string]: Json;
	}
>({
	errorFormatter(err) {
		return {
			type: typeof err.cause === "string" ? err.cause : null,
			...err.data,
			message: err.message,
			zodError: err.cause instanceof z.ZodError ? formatZodError(err.cause) : null
		};
	}
});
