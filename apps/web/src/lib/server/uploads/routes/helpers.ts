import type { RequestEvent } from "@sveltejs/kit";
import { UploadThingError } from "@uploadthing/shared";

import { db } from "$lib/convex/server";

export function assertAuthenticated(
	req: RequestEvent
): asserts req is RequestEvent & { locals: { user: NonNullable<App.Locals["user"]> } } {
	if (!req.locals.user) {
		throw new UploadThingError({
			code: "UNAUTHENTICATED" as UploadThingError["code"],
			message: "You must be authenticated to upload"
		});
	}
}
