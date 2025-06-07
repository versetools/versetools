import { type Handle } from "@sveltejs/kit";

import { building } from "$app/environment";
import { getConsent } from "$server/consent";
import { init } from "$server/init";
import { logger } from "$server/utils/logger";

import { csrfHandler } from "./csrf-handler.server";

if (!building) init();

export const handle: Handle = async ({ event, resolve }) => {
	if (import.meta.env.PROD) {
		logger.log(`${event.request.method} ${event.request.url.toString()}`);
	}

	// const lang = event.request.headers.get("accept-language")?.split(",")[0];
	// locale.set(lang ? lang : null);

	event.locals.consent = getConsent(event);

	// Handle CSRF
	let response: Promise<Response> | Response | null = csrfHandler(event);
	if (!response) {
		response = await resolve(event);
	}

	return response;
};
