import { createBus } from "@l3dev/event-buses";
import { createInteropBus } from "@versetools/interop";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { config } from "$lib/config";

const REDIS_URL = building ? process.env.REDIS_URL : env.REDIS_URL;

export const bus = createBus({
	defaultPrefix: config.domain,
	redisUrl: REDIS_URL!
});

export const interopBus = createInteropBus(bus);
