import { logger } from "@l3dev/logger";

export * from "./buses";

export function loadWorkers() {
	for (const file of Object.keys(import.meta.glob("./**/*.worker.ts", { eager: true }))) {
		logger.log(`Running worker: ${file}`);
	}
}
