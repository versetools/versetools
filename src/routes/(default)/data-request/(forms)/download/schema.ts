import { z } from "zod";

import { config } from "$lib/config";

import { DataRequestSchema } from "../schema";

export const ProductsSchema = z.enum(
	Object.keys(config.services) as [keyof typeof config.services]
);

export const DownloadRequestSchema = DataRequestSchema.extend({
	allProducts: z.boolean(),
	products: ProductsSchema.array()
});
