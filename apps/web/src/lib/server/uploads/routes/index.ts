import type { FileRouter } from "uploadthing/server";

import userAvatar from "./user-avatar";

export const routes = {
	"user.avatar": userAvatar
} satisfies FileRouter;
