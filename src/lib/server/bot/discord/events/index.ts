import { loadEventListeners } from "@versetools/discord.js-helpers";

import { logger } from "$server/utils/logger";

export const eventListeners = loadEventListeners({
	getModules<T>() {
		return import.meta.glob<true, string, T>("./*.event.ts", { eager: true });
	},
	logger
});
