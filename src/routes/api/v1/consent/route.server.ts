import { ok } from "@l3dev/api-result";
import { createRouteBuilder } from "@l3dev/svelte-api/server";
import { z } from "zod";

import { setConsent } from "$server/consent";

import type { RequestEvent } from "./$types";

export const PostConsentSchema = z.object({
	choice: z.union([z.literal("accept"), z.literal("reject")])
});

export const v1_consent_route = createRouteBuilder<RequestEvent>()
	.POST((endpoint) =>
		endpoint.input(PostConsentSchema).handler(({ event, input }) => {
			const consent = setConsent(event, input.choice);
			return ok(consent);
		})
	)
	.build();
