import type { FileRouter } from "uploadthing/server";

import { routes } from "./routes";

export const uploadsRouter = routes satisfies FileRouter;

export type UploadsRouter = typeof uploadsRouter;
