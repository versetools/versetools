import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("Expire action cache", { hours: 24 }, internal.server.cache.purge, {});

export default crons;
