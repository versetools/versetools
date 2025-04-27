import { loadCommands } from "@versetools/discord.js-helpers";

import { logger } from "$server/utils/logger";

export const commands = loadCommands({
	getModules<T>() {
		return import.meta.glob<true, string, T>("./*.command.ts", { eager: true });
	},
	logger
});
