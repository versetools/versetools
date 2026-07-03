import { identifier } from "haywire";

import type { GenericCtx } from "../../helpers";

export const genericCtxId = identifier<GenericCtx<any>>();
export const genericArgsId = identifier<object>();
