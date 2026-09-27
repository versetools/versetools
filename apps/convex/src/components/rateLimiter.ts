// eslint-disable-next-line import-x/no-named-as-default
import RateLimiter from "@convex-dev/rate-limiter";

import { components } from "$convex/_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {});
