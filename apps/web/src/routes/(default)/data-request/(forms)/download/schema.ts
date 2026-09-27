import * as z from "zod";

import { DataRequestSchema } from "../schema";

import { config } from "$lib/config";


export const ServiceSchema = z.enum(Object.keys(config.services) as [keyof typeof config.services]);

export const DownloadRequestSchema = DataRequestSchema.extend({
	allServices: z.boolean(),
	services: ServiceSchema.array()
});
