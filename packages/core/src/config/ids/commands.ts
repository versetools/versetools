import { identifier } from "haywire";

import type { RunnerService } from "../../services/commands/RunnerService";
import type { SubscriptionRegistry } from "../../services/commands/subscriptions/SubscriptionRegistry";

export const runnerServiceId = identifier<RunnerService<any>>();
export const subscriptionRegistryId = identifier<SubscriptionRegistry<any>>();
