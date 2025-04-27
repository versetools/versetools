import { error } from "@sveltejs/kit";

import type { PageLoad } from "./$types";

export const load = (async ({ url }) => {
	error(404, `${url.pathname} not found`);
}) satisfies PageLoad;
