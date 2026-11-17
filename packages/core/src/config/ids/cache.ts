import { identifier } from "haywire";

import type { ActionCacheFunctionReferences } from "../../services/cache/ActionCache";

export const actionCacheApiId = identifier<ActionCacheFunctionReferences>().named("actionCacheApi");
