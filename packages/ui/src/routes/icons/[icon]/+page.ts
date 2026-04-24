import type { PageLoad } from "./$types";

export const load = (async ({ params }) => {
	return {
		icon: params.icon
	};
}) satisfies PageLoad;
