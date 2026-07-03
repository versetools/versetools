import { uploadthingApiKeyId } from "@versetools/core/config/ids/files";
import { bind, createModule } from "haywire";

import { env } from "$convex/_generated/server";

export const envModule = createModule(
	bind(uploadthingApiKeyId).withInstance(env.UPLOADTHING_API_KEY)
);
