import { loadCommands } from "@l3dev/discord.js-helpers";
import { logger } from "@l3dev/logger";

export const commands = loadCommands({
	getModules<T>() {
		return import.meta.glob<true, string, T>("./*.command.ts", { eager: true });
	},
	logger
});
