import { CronTime } from "@l3dev/event-buses";

import { cleanupSessions } from "$server/sessions";

import { bus } from "../buses";
import { ScheduleName } from "../schedules";

bus.createSchedule(
	ScheduleName.SessionCleanup,
	{
		repeat: {
			pattern: CronTime.everyDay()
		}
	},
	async ({ logger }) => {
		logger.log(`Cleaning up expired sessions...`);
		await cleanupSessions();
	}
);
