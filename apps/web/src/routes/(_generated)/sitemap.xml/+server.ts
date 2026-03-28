import * as sitemap from "super-sitemap";

import { PUBLIC_SITE_URL } from "$env/static/public";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	return await sitemap.response({
		origin: PUBLIC_SITE_URL,
		excludeRoutePatterns: [
			".*/api.*",
			"/error/.*",
		]
	});
};
