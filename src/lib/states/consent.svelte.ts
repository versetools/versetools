import { createSvelteState } from "@l3dev-private/consent-svelte";

import { api } from "$routes/api";
import type { SiteConsent } from "$server/consent";

export const consent = createSvelteState<SiteConsent>({
	api,
	route: api.v1.consent
});
