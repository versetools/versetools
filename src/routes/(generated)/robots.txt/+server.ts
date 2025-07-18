import { config } from "$lib/config";
import { createETag } from "$server/utils/etag";

import type { RequestHandler } from "./$types";

export const prerender = true;

export const GET: RequestHandler = async () => {
	const body = `Sitemap: https://${config.domain}/sitemap.xml

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
