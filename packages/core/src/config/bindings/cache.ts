import { bind } from "haywire";

import { genericCtxId } from "../../routers";
import { ActionCacheService } from "../../services/cache/ActionCacheService";
import { actionCacheApiId } from "../ids/cache";

export const actionCacheServiceBinding = bind(ActionCacheService)
	.withDependencies([genericCtxId, actionCacheApiId])
	.withProvider((ctx, api) => new ActionCacheService(ctx, api));
