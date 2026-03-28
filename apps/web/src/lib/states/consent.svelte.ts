import { Consent } from "@l3dev-private/consent";
import { createSvelteState } from "@l3dev-private/consent-svelte";

export const consentManager = new Consent({
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	minimumVersionDate: new Date("2026-03-28"),
	vendors: {
		posthog: {
			name: "PostHog",
			description:
				"PostHog is a product analytics platform that helps us understand how you use our services.",
			privacyPolicyUrl: "https://posthog.com/privacy"
		}
	}
});

export const consent = createSvelteState(consentManager);
