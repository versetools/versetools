import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(rateLimiter);
app.use(workflow);

export default app;
