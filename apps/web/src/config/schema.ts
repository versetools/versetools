import config from "@versetools/config";
import type { SoftwareApplication } from "schema-dts";

type CreatorType<T = SoftwareApplication["author"]> = T extends { "@type": string } ? T : never;

export const schemaConfig = {
	/** https://developers.google.com/search/docs/appearance/structured-data/software-app#softwareapplication */
	appCategory: "UtilitiesApplication",
	publishDate: "2025-03-23",
	creator: {
		"@type": "Person",
		name: config.creatorHandle,
		givenName: "Leon",
		url: "https://l3.dev"
	} satisfies CreatorType
};
