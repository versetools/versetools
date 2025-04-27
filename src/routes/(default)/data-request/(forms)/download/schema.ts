import { z } from "zod";

import { config } from "$lib/config";

import { DataRequestSchema } from "../schema";

export const ProductsSchema = z.enum(
	Object.keys(config.products) as [keyof typeof config.products]
);

export const DownloadRequestSchema = DataRequestSchema.extend({
	allProducts: z.boolean(),
	products: ProductsSchema.array()
});
