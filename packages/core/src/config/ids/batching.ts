import { identifier } from "haywire";

import type { BatchingFunctionReferences } from "../../services/BatchingService";

export const batchingApiId = identifier<BatchingFunctionReferences>().named("batchingApi");
