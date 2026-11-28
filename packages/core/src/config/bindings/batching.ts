import { bind } from "haywire";

import { genericCtxId } from "../../routers";
import { BatchingService } from "../../services/BatchingService";
import { batchingApiId } from "../ids/batching";

export const batchingServiceBinding = bind(BatchingService)
	.withDependencies([genericCtxId, batchingApiId])
	.withProvider((ctx, api) => new BatchingService(ctx, api));
