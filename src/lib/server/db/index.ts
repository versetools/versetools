import "./load-dotenv";

import { drizzle } from "drizzle-orm/node-postgres";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";

import * as schema from "./schema";

const DATABASE_URL = building ? process.env.DATABASE_URL : env.DATABASE_URL;

export const db = drizzle(DATABASE_URL!, {
	schema
});

export * from "./schema";
