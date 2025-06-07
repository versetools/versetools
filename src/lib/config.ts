import type { InteropServiceName } from "@versetools/interop";
import type { SoftwareApplication } from "schema-dts";

import emblem from "$lib/assets/emblem.png";
import scorgportalThumbnail from "$lib/assets/scorgportal-thumbnail.png";

type CreatorType<T = SoftwareApplication["author"]> = T extends { "@type": string } ? T : never;

export type ServiceDef = {
	name: string;
	description: string;
	thumbnail: string;
	url: string;
	exportUrl: string;
};

export const config = {
	name: "VerseTools",
	domain: "versetools.com",
	creator: {
		"@type": "Person",
		name: "@l3dotdev",
		url: "https://github.com/l3dotdev"
	} satisfies CreatorType,
	emails: {
		contact: "hello@versetools.com",
		support: "support@versetools.com",
		datarequest: "datarequest@versetools.com"
	},
	socials: {
		discord: "https://versetools.com/discord",
		github: "https://github.com/versetools"
	},
	services: {
		scorgportal: {
			name: "ScOrgPortal",
			description: "The ultimate org management tool for your Star Citizen organization",
			thumbnail: scorgportalThumbnail,
			url: "https://scorgportal.com",
			exportUrl: "https://scorgportal.com/settings/export"
		}
	} satisfies Record<Exclude<InteropServiceName, InteropServiceName.VerseTools>, ServiceDef>,
	meta: {
		emblem,
		thumbnail: null,
		color: "#5f48b9",
		twitterHandle: "@l3dotenv",
		publishDate: "2025-03-23",
		// https://developers.google.com/search/docs/appearance/structured-data/software-app#softwareapplication
		appCategory: "UtilitiesApplication",
		description: "A collection of tools to improve your Star Citizen experience",
		keywords: [
			"verse tools",
			"star citizen verse tools",
			"sc verse tools",
			"star citizen tools",
			"sc tools",
			"sc",
			"star citizen"
		]
	},
	cookies: {
		session: "__versetools.sid",
		consent: "versetools_consent"
	}
};
