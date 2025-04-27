import type { RequestEvent } from "@sveltejs/kit";
import { createBuilder } from "uploadthing/server";

type AdapterArgs = {
	req: RequestEvent;
};

export const uploadthing = createBuilder<AdapterArgs>();
