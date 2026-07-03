import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import posthog from "@posthog/convex/convex.config.js";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
	env: {
		SITE_URL: v.string(),
		CONVEX_SECRET: v.string(),

		AWS_ACCESS_KEY_ID: v.string(),
		AWS_SECRET_ACCESS_KEY: v.string(),

		POSTHOG_PROJECT_TOKEN: v.string(),
		POSTHOG_HOST: v.optional(v.string()),
		POSTHOG_PERSONAL_API_KEY: v.optional(v.string()),
		POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS: v.optional(v.string()),

		UPLOADTHING_APP_ID: v.string(),
		UPLOADTHING_API_KEY: v.string()
	}
});

app.use(posthog, {
	env: {
		POSTHOG_PROJECT_TOKEN: app.env.POSTHOG_PROJECT_TOKEN,
		POSTHOG_HOST: app.env.POSTHOG_HOST,
		POSTHOG_PERSONAL_API_KEY: app.env.POSTHOG_PERSONAL_API_KEY,
		POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS: app.env.POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS
	}
});

app.use(rateLimiter);
app.use(workflow);

export default app;
