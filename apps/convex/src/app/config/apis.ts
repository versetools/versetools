import { FileStorageAPI, PosthogAPI, RSIAPI } from "../apis";
import { runner } from "./runner";

export const fileStorage = new FileStorageAPI(runner);

export const posthog = new PosthogAPI(runner, {
	projectId: process.env.POSTHOG_PROJECT_ID!,
	apiKey: process.env.POSTHOG_API_KEY!
});

export const rsi = new RSIAPI(runner);
