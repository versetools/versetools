import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("Expire action cache", { hours: 24 }, internal.server.cache.actions.purge, {});
crons.interval("Sync feature flags", { minutes: 10 }, internal.server.posthog.syncFeatureFlags);

export default crons;
