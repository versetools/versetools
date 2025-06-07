import { CronTime } from "@l3dev/event-buses";

import { archiveDataRequest, getArchiveableDataRequests } from "$server/data-requests";

import { bus } from "../buses";
import { ScheduleName } from "../schedules";

bus.createSchedule(
	ScheduleName.DataRequestArchiving,
	{
		repeat: {
			pattern: CronTime.everyThursday()
		}
	},
	async ({ logger }) => {
		const requestsResult = await getArchiveableDataRequests();
		if (!requestsResult.ok) {
			logger.error("Failed to fetch data requests", requestsResult.context.error);
			return;
		}

		if (!requestsResult.value.length) {
			logger.log("No data requests to archive");
			return;
		}

		logger.log(`Archiving ${requestsResult.value.length} data requests...`);

		for (const request of requestsResult.value) {
			await archiveDataRequest(request);
		}
	}
);
