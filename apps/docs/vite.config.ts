import { theme } from "./src/lib/theme";
import { sveltepress } from "@sveltepress/vite";
import { defineConfig } from "vite";

import remarkCustomHeaderId from "remark-custom-header-id";
import remarkSectionize from "remark-sectionize";

import appConfig from "@versetools/config";

const config = defineConfig({
	plugins: [
		sveltepress({
			theme: theme({
				themeColor: {
					dark: "hsl(0,0%,12%)",
					light: "hsl(256,44%,95%)",
					primary: "hsl(252,79%,72%)",
					hover: "hsl(256,44%,98%)",
					gradient: { start: "hsl(246,51%,62%)", end: "hsl(192,86%,68%)" }
				},
				navbar: [
					{
						title: "Policies",
						to: "/policies"
					}
				],
				sidebar: {
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
											title: "Processors",
											to: "/policies/privacy/processors"
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
				},
				editLink: "https://github.com/versetools/versetools/tree/main/apps/docs/src/routes/:route",
				discord: appConfig.socials.discord,
				github: appConfig.socials.github + "/versetools",
				logo: "/favicon.png"
			}),
			siteConfig: {
				title: appConfig.name + " Docs",
				description: ""
			},
			remarkPlugins: [remarkCustomHeaderId, remarkSectionize as any]
		})
	],
	server: {
		port: 5171,
		allowedHosts: ["docs.versetools.com", "host.docker.internal"]
	}
});

export default config;
