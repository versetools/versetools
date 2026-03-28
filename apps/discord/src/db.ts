import { createWebsocketClient } from "@versetools/convex-client";

export const db = createWebsocketClient({
	url: process.env.CONVEX_URL!,
	secret: process.env.CONVEX_SECRET!,
	logger: false
});
