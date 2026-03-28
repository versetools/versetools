import { err, ok, Result } from "@l3dev/result";
import { useConvexClient } from "@mmailaender/convex-svelte";
import { isConvexResultError } from "@versetools/core/errors";
import type { MutationOptions } from "convex/browser";
import type { FunctionArgs, FunctionReference } from "convex/server";

async function wrapConvexCall<T>(call: () => Promise<T>) {
	try {
		const result = await call();
		return ok(result);
	} catch (error) {
		if (isConvexResultError(error)) {
			const { type, context } = error.data;
			return err(type as string & {}, context);
		}
		return err("UNKNOWN_ERROR", {
			error
		});
	}
}

export function useConvex() {
	const client = useConvexClient();

	return Object.assign(client, {
		safeQuery: async function <Query extends FunctionReference<"query">>(
			query: Query,
			args: Query["_args"]
		) {
			return Result.unwrap(await wrapConvexCall(() => client.query(query, args)));
		},
		safeMutation: async function <Mutation extends FunctionReference<"mutation">>(
			mutation: Mutation,
			args: FunctionArgs<Mutation>,
			options?: MutationOptions
		) {
			return Result.unwrap(await wrapConvexCall(() => client.mutation(mutation, args, options)));
		},
		safeAction: async function <Action extends FunctionReference<"action">>(
			action: Action,
			args: FunctionArgs<Action>
		) {
			return Result.unwrap(await wrapConvexCall(() => client.action(action, args)));
		}
	});
}
