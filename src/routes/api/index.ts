import { createAPI, route } from "@l3dev/svelte-api/client";

import { browser, dev } from "$app/environment";
import { config } from "$lib/config";

import type { v1_consent_route } from "./v1/consent/route.server";

export const api = createAPI({
	baseUrl: dev ? (browser ? window.location.origin : "localhost:5173") : config.domain,
	routes: {
		v1: {
			consent: route<typeof v1_consent_route>("/api/v1/consent")
		}
	}
});
