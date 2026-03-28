import { Effect } from "effect";
import { makeAdapterHandler } from "uploadthing/server";
import type { FileRouter, RouteHandlerOptions } from "uploadthing/types";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { PUBLIC_SITE_URL } from "$env/static/public";
import { uploadsRouter } from "$server/uploads";

const UPLOADTHING_TOKEN = building ? process.env.UPLOADTHING_TOKEN : env.UPLOADTHING_TOKEN;

// We must create our own handlers because uploadthing just provides the request instead of the whole event
function createHandlers<TRouter extends FileRouter>(opts: RouteHandlerOptions<TRouter>) {
	return makeAdapterHandler(
		(ev) => Effect.succeed({ req: ev }),
		(ev) => Effect.succeed("request" in ev ? ev.request : ev),
		opts,
		"server"
	);
}

const handlers = createHandlers({
	router: uploadsRouter,
	config: {
		token: UPLOADTHING_TOKEN,
		callbackUrl: `${PUBLIC_SITE_URL}/api/upload`
	}
});

export { handlers as GET, handlers as POST };
