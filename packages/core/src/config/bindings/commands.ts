import { bind, requestScope } from "haywire";

import { RunnerService } from "../../services/commands/RunnerService";
import { genericRunnerServiceId, genericSubscriptionRegistryId } from "../ids/commands";
import { genericCtxId } from "../../routers";

export const runnerServiceBinding = bind(genericRunnerServiceId)
	.withDependencies([genericCtxId, genericSubscriptionRegistryId])
	.withProvider((ctx, registry) => new RunnerService(ctx, registry))
	.scoped(requestScope);
