import * as sitemap from "super-sitemap";

import type { RequestHandler } from "./$types";

import { PUBLIC_SITE_URL } from "$env/static/public";


export const GET: RequestHandler = async () => {
	return await sitemap.response({
		origin: PUBLIC_SITE_URL,
		excludeRoutePatterns: [".*/api.*", "/error/.*"]
	});
};
