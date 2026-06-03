import type { LinkItem } from "virtual:sveltepress/theme";

export const sidebar: Record<string, LinkItem[]> = {
	"/policies": [
		{
			title: "Policies",
			to: "/policies",
			items: [
				{
					title: "Terms of Service",
					to: "/policies/terms"
				},
				{
					title: "Use Restrictions",
					to: "/policies/abuse"
				},
				{
					title: "Privacy Policy",
					collapsible: true,
					to: "/policies/privacy",
					items: [
						{
							title: "Cookies",
							to: "/policies/privacy/cookies"
						},
						{
							title: "Subprocessors",
							to: "/policies/privacy/subprocessors"
						},
						{
							title: "Regulations",
							collapsible: true,
							items: [
								{
									title: "CCPA",
									to: "/policies/privacy/regulations/ccpa"
								}
							]
						}
					]
				},
				{
					title: "Payments and Subscriptions",
					collapsible: true,
					items: [
						{
							title: "Cancellations",
							to: "/policies/cancellation"
						},
						{
							title: "Refunds",
							to: "/policies/refunds"
						},
						{
							title: "Taxes",
							to: "/policies/taxes"
						}
					]
				},
				{
					title: "Security Overview",
					collapsible: true,
					to: "/policies/security",
					items: [
						{
							title: "Security Response",
							to: "/policies/security/response"
						}
					]
				},
				{
					title: "Copyright Claims",
					to: "/policies/copyright"
				}
			]
		}
	]
};
