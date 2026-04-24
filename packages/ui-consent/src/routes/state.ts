import { Consent } from "@l3dev-private/consent";
import { createSvelteState } from "@l3dev-private/consent-svelte";

export const consent = createSvelteState(
	new Consent({
		minimumVersionDate: new Date("2025-06-23"),
		vendors: {
			"google-analytics": {
				name: "Google Analytics",
				description:
					"Google Analytics is a web analytics service offered by Google that tracks and reports how you use our website.",
				privacyPolicyUrl: "https://policies.google.com/technologies/partner-sites"
			},
			posthog: {
				name: "PostHog",
				description:
					"PostHog is an open-source product analytics platform that helps us understand your behavior.",
				privacyPolicyUrl: "https://posthog.com/privacy"
			}
		}
	})
);
