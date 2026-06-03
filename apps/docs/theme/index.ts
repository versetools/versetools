import config from "@versetools/config";

import { sidebar } from "./sidebar";
import { theme } from "../src/lib/theme";

export default theme({
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
	sidebar,
	editLink: "https://github.com/versetools/versetools/tree/main/apps/docs/src/routes/:route",
	discord: config.socials.discord,
	github: config.socials.github + "/versetools",
	logo: "/favicon.png",
	footer: {
		copyright: config.company.name,
		links: [
			{
				label: "Terms",
				to: "/policies/terms"
			},
			{
				label: "Privacy",
				to: "/policies/privacy"
			},
			{
				label: "Status",
				to: "https://status.versetools.com"
			}
		]
	}
});

export const siteConfig = {
	title: config.name + " Docs",
	description: `Documentation for ${config.name} sites`
};
