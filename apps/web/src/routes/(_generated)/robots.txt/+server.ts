import { PUBLIC_SITE_URL } from "$env/static/public";
import { createETag } from "$server/etag";

import type { RequestHandler } from "./$types";

export const prerender = true;

export const GET: RequestHandler = async () => {
	const body = `Sitemap: ${PUBLIC_SITE_URL}/sitemap.xml

# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow: /api`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain",
			"Cache-Control": "public, must-revalidate, max-age=0, s-maxage=3600",
			ETag: createETag(body)
		}
	});
};
