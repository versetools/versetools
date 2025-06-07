import { logger } from "@l3dev/logger";
import { InteropQueueName } from "@versetools/interop";
import { eq } from "drizzle-orm";

import { DataRequestStatus } from "$server/data-requests";
import { db, safeExecute, tables } from "$server/db";

import { interopBus } from "../buses";

const queue = interopBus.createGlobalQueue(InteropQueueName.DataRequests);

interopBus.createGlobalInteropWorker(queue, async (job) => {
	const serviceResults = await job.getChildrenValues<any>();

	const result = await safeExecute(
		"COMPLETE_DATA_REQUEST_PROCESSING",
		db
			.update(tables.dataRequests)
			.set({
				status: DataRequestStatus.PendingReview,
				collectedData: job.data.dataRequest.type === "export" ? serviceResults : null
			})
			.where(eq(tables.dataRequests.id, job.data.dataRequest.id))
	);
	if (!result.ok) {
		logger.error("Failed to complete processing request data", result);
		throw result.context.error;
	}
});
