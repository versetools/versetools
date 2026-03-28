import { createHttpClient } from "@versetools/convex-client";
import type { RequestEvent } from "@sveltejs/kit";

import { env } from "$env/dynamic/private";
import { PUBLIC_CONVEX_URL } from "$env/static/public";

const JWT_HEADER_NAME = "x-convex-jwt";

export function getToken(event: RequestEvent) {
	return event.request.headers.get(JWT_HEADER_NAME);
}

export const db = createHttpClient({
	url: PUBLIC_CONVEX_URL,
	secret: env.CONVEX_SECRET
});
