import "./load-dotenv";

import { Result } from "@l3dev/result";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction, PgTransactionConfig } from "drizzle-orm/pg-core";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";

import { InlineTransactionImpl } from "./inline-transaction";
import * as schema from "./schema";

export * from "./schema";

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

export function safeExecute<TType extends string, T>(
	type: TType,
	statement: { execute: () => Promise<T> }
) {
	return Result.fromPromise({ onError: { type } }, statement.execute());
}

export function safeTransaction<TType extends string, T>(
	type: TType,
	transaction: (
		tx: PgTransaction<
			NodePgQueryResultHKT,
			typeof schema,
			ExtractTablesWithRelations<typeof schema>
		>
	) => Promise<T>,
	config?: PgTransactionConfig
) {
	return Result.fromPromise({ onError: { type } }, db.transaction(transaction, config));
}
