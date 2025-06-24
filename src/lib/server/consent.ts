import { Consent } from "@l3dev-private/consent";

export const consent = new Consent({
	minimumVersionDate: new Date("2025-06-24"),
	vendors: {
		posthog: {
			name: "PostHog",
			description:
				"PostHog is a product analytics platform that helps us understand how you use our services.",
			privacyPolicyUrl: "https://posthog.com/privacy"
		}
	}
});

export type SiteConsent = typeof consent;
