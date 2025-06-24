import { consent } from "$server/consent";

import type { LayoutServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	return {
		consent: {
			consents: locals.consents,
			vendors: consent.vendors
		}
	};
}) satisfies LayoutServerLoad;
