import { CronTime } from "@l3dev/event-buses";

import { getUnverifiedDataRequests, sendDataRequestVerifyEmails } from "$server/data-requests";

import { bus } from "../buses";
import { ScheduleName } from "../schedules";

bus.createSchedule(
	ScheduleName.DataRequestReminder,
	{
		repeat: {
			pattern: CronTime.every(6).hours()
		}
	},
	async ({ logger }) => {
		logger.log("Processing job: Data request reminder...");

		const requestsResult = await getUnverifiedDataRequests();
		if (!requestsResult.ok) {
			logger.error("Failed to fetch data requests", requestsResult.context.error);
			return;
		}

		logger.log(`Checking verify reminders for ${requestsResult.value.length} data requests...`);

		for (const request of requestsResult.value) {
			await sendDataRequestVerifyEmails(request);
		}
	}
);
