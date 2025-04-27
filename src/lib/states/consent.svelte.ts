import type { z } from "zod";

import type { ConsentSchema } from "$server/consent";

export type ConsentData = z.infer<typeof ConsentSchema>;

let state = $state<ConsentData | null>(null);
export const consent = {
	get value() {
		return state;
	},
	set value(value: ConsentData | null) {
		state = value;
	}
};
