import { mergeSchema } from "@versetools/core/helpers";

import { actionCacheSchema } from "./cache/actionCache";
import { filesSchema } from "./files/files";
import { locationsSchema } from "./locations";

export type * from "./cache/actionCache";
export type * from "./files/files";

export const schema = mergeSchema([actionCacheSchema, filesSchema, locationsSchema]);
