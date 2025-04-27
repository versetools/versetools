import type { FileRouter } from "uploadthing/server";

import { dataRequestEvidenceRoute } from "./routes/data-request-evidence.route";

export const uploadsRouter = {
	dataRequestEvidence: dataRequestEvidenceRoute
} satisfies FileRouter;

export type UploadsRouter = typeof uploadsRouter;
