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
					title: "Privacy Policy",
					collapsible: true,
					to: "/policies/privacy",
					items: [
						{
							title: "Cookies",
							to: "/policies/privacy/cookies"
						},
						{
							title: "Our Subprocessors",
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
					title: "Use Restrictions",
					to: "/policies/abuse"
				},
				{
					title: "Copyright Claims",
					to: "/policies/copyright"
				}
			]
		}
	]
};
