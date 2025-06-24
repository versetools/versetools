import { logger } from "@l3dev/logger";
import { sveltekit } from "@l3dev-private/consent/adapters";
import { type Handle } from "@sveltejs/kit";

import { building } from "$app/environment";
import { consent } from "$server/consent";
import { init } from "$server/init";

import { csrfHandler } from "./csrf-handler.server";

if (!building) init();

export const handle: Handle = async ({ event, resolve }) => {
	// const lang = event.request.headers.get("accept-language")?.split(",")[0];
	// locale.set(lang ? lang : null);

	const consentsResult = consent.getConsents(sveltekit(event));
	if (!consentsResult.ok) {
		logger.error("Failed to get consents", {
			url: event.url,
			method: event.request.method,
			headers: event.request.headers,
			error: consentsResult
		});
	}

	event.locals.consents = consentsResult.ok ? consentsResult.value : null;

	// Handle CSRF
	let response: Promise<Response> | Response | null = csrfHandler(event);
	if (!response) {
		response = await resolve(event);
	}

	return response;
};
