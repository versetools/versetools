import { requestLogObj, tracingLogObj } from "@versetools/observability";
import { Logger } from "tslog";

import { dev } from "$app/environment";

export const logger = new Logger(
	{ name: "main", type: dev ? "pretty" : "json" },
	{
		...requestLogObj,
		...tracingLogObj
	}
);
