import "./load-dotenv";

import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";

import { InlineTransactionImpl } from "./inline-transaction";
import * as schema from "./schema";

const DATABASE_URL = building ? process.env.DATABASE_URL : env.DATABASE_URL;

export const db = Object.assign(
	drizzle(DATABASE_URL!, {
		schema
	}),
	{
		inlineTransaction: (config?: PgTransactionConfig) => {
			return InlineTransactionImpl.create<typeof schema>(db, config);
		}
	}
);

export * from "./schema";
