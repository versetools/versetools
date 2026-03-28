import { config } from "@versetools/core/config";

const baseURL = process.env.SITE_URL ?? `https://${config.domain}`;

export class SiteUrls {
	static getBaseURL() {
		return baseURL;
	}

	static siteURL(path: string) {
		const url = new URL(path, baseURL);
		return url.toString();
	}
}
