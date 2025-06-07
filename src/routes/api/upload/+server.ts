import { createRouteHandler } from "uploadthing/server";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { uploadsRouter } from "$lib/server/uploads";

const UPLOADTHING_TOKEN = building ? process.env.UPLOADTHING_TOKEN : env.UPLOADTHING_TOKEN;

const handlers = createRouteHandler({
	router: uploadsRouter,
	config: {
		token: UPLOADTHING_TOKEN
	}
});

export { handlers as GET, handlers as POST };
