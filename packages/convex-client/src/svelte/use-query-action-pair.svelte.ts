import { useQuery, type UseQueryOptions } from "@mmailaender/convex-svelte";
import { getResultErrorType, isConvexResultError } from "@versetools/core/errors";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

import { useActionQuery } from "./use-action-query.svelte";

export type UseQueryActionPairReturn<
	Query extends FunctionReference<"query">,
	Action extends FunctionReference<"action">
> =
	| {
			data: undefined;
			actionData: undefined;
			error: undefined;
			isLoading: true;
			isStale: false;
			runAction: (args?: FunctionArgs<Action>) => Promise<void>;
	  }
	| {
			data: undefined;
			actionData: undefined;
			error: Error;
			isLoading: false;
			isStale: boolean;
			runAction: (args?: FunctionArgs<Action>) => Promise<void>;
	  }
	| {
			data: FunctionReturnType<Query>;
			actionData: FunctionReturnType<Action>;
			error: undefined;
			isLoading: false;
			isStale: boolean;
			runAction: (args?: FunctionArgs<Action>) => Promise<void>;
	  };

export function useQueryActionPair<
	Query extends FunctionReference<"query">,
	Action extends FunctionReference<"action", "public", Partial<Query["_args"]>>
>(
	{ query, action }: { query: Query; action: Action },
	args: {
		query: FunctionArgs<Query> | "skip" | (() => FunctionArgs<Query> | "skip");
		action: FunctionArgs<Action> | "skip" | (() => FunctionArgs<Action> | "skip");
	},
	options?: UseQueryOptions<Query>
): UseQueryActionPairReturn<Query, Action> {
	const actionResult = useActionQuery(action, args.action, options);
	const queryResult = useQuery(
		query,
		() => {
			if (actionResult.isLoading || actionResult.error) {
				return "skip";
			}
			return typeof args.query === "function"
				? (args.query as () => FunctionArgs<Query> | "skip")()
				: args.query;
		},
		options
	);

	$effect(() => {
		const error = queryResult.error;
		if (
			error &&
			!actionResult.isLoading &&
			!actionResult.error &&
			isConvexResultError(error) &&
			getResultErrorType(error) === "useActionQuery.refetch"
		) {
			actionResult.refetch();
		}
	});

	return {
		get data() {
			return queryResult.data;
		},
		get actionData() {
			return actionResult.data;
		},
		get isLoading() {
			return (actionResult.isLoading || queryResult.isLoading) && !this.error;
		},
		get error() {
			return actionResult.error ?? queryResult.error;
		},
		get isStale() {
			return actionResult.isStale || queryResult.isStale;
		},
		async runAction(args?: FunctionArgs<Action>) {
			return await actionResult.refetch(args);
		}
	} as UseQueryActionPairReturn<Query, Action>;
}
