import { loadEventListeners } from "@l3dev/discord.js-helpers";
import { logger } from "@l3dev/logger";

export const eventListeners = loadEventListeners({
	getModules<T>() {
		return import.meta.glob<true, string, T>("./**/*.event.ts", { eager: true });
	},
	logger
});
