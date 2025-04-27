import type { LayoutServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	return {
		consent: locals.consent
	};
}) satisfies LayoutServerLoad;
