import { logger } from "@l3dev/logger";

import { startDiscordBot } from "./bot/discord";
import { loadWorkers } from "./bus";
import { cleanupSessions } from "./sessions";

export function init() {
	startDiscordBot();
	loadWorkers();

	logger.log(`Cleaning up expired sessions...`);
	cleanupSessions();
}
