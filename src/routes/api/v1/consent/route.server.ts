import { createRoute } from "@l3dev-private/consent-svelte/server";

import { consent } from "$server/consent";

import type { RequestEvent } from "./$types";

export const v1_consent_route = createRoute<RequestEvent>(consent);
