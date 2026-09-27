import { bind, requestScope } from "haywire";

import { genericCtxId } from "../../routers";
import { RunnerService } from "../../services/commands/RunnerService";
import { genericRunnerServiceId, genericSubscriptionRegistryId } from "../ids/commands";

export const runnerServiceBinding = bind(genericRunnerServiceId)
	.withDependencies([genericCtxId, genericSubscriptionRegistryId])
	.withProvider((ctx, registry) => new RunnerService(ctx, registry))
	.scoped(requestScope);
