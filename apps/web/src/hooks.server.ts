import { withRequest, withTracing } from "@versetools/observability";
import { error, type Handle } from "@sveltejs/kit";

import { db } from "$lib/convex/server";

import { csrfHandler } from "./csrf-handler.server";

export const handle: Handle = async ({ event, resolve }) => {
	return await withRequest(event.request, () =>
		withTracing(event.tracing.root, async () => {
			// Handle CSRF
			const response: Promise<Response> | Response | null = csrfHandler(event);
			if (response) {
				return response;
			}

			if (event.url.pathname.startsWith("/api/internal")) {
				const secretHeader = event.request.headers.get("x-api-secret");
				if (secretHeader !== db.secret) {
					error(401, {
						message: "Missing authentication",
						type: "UNAUTHENTICATED"
					});
				}
			}

			return await resolve(event);
		})
	);
};
