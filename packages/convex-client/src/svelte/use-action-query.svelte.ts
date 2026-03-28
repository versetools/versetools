import { useConvexClient } from "@mmailaender/convex-svelte";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { convexToJson } from "convex/values";

export type UseActionQueryOptions = {
	keepPreviousData?: boolean;
};

export type UseActionQueryReturn<Action extends FunctionReference<"action">> =
	| {
			data: undefined;
			error: undefined;
			isLoading: true;
			isStale: false;
			refetch: (args?: FunctionArgs<Action>) => Promise<void>;
	  }
	| {
			data: undefined;
			error: Error;
			isLoading: false;
			isStale: boolean;
			refetch: (args?: FunctionArgs<Action>) => Promise<void>;
	  }
	| {
			data: FunctionReturnType<Action>;
			error: undefined;
			isLoading: false;
			isStale: boolean;
			refetch: (args?: FunctionArgs<Action>) => Promise<void>;
	  };

const useActionQuery_SKIP = Symbol("useActionQuery.skip");

export function useActionQuery<Action extends FunctionReference<"action">>(
	action: Action,
	args: FunctionArgs<Action> | "skip" | (() => FunctionArgs<Action> | "skip"),
	options?: UseActionQueryOptions
): UseActionQueryReturn<Action> {
	const client = useConvexClient();

	const state = $state({
		result: undefined as any,
		lastResult: undefined as any,
		argsForLastResult: undefined as any
	});

	/*
	 ** staleness & args tracking **
	 * Are the args (the query key) the same as the last args we received a result for?
	 */
	const currentArgs = $derived.by(() => {
		const resolvedArgs =
			typeof args === "function" ? (args as () => FunctionArgs<Action> | "skip")() : args;
		if (resolvedArgs === "skip") {
			return useActionQuery_SKIP;
		}
		return resolvedArgs;
	});
	const sameArgsAsLastResult = $derived(
		state.argsForLastResult !== undefined &&
			currentArgs !== useActionQuery_SKIP &&
			state.argsForLastResult !== useActionQuery_SKIP &&
			JSON.stringify(convexToJson(state.argsForLastResult)) ===
				JSON.stringify(convexToJson(currentArgs))
	);
	const staleAllowed = $derived(!!(options?.keepPreviousData && state.lastResult));
	const isSkipped = $derived(currentArgs === useActionQuery_SKIP);

	async function runAction(args: FunctionArgs<Action>) {
		if (isSkipped || args === useActionQuery_SKIP) {
			state.result = undefined;
			state.argsForLastResult = useActionQuery_SKIP;
			return undefined;
		}

		let dataFromServer;
		try {
			dataFromServer = client.disabled ? undefined : await client.action(action, args);

			const copy = structuredClone(dataFromServer);
			state.result = copy;
			state.argsForLastResult = args;
			state.lastResult = copy;
		} catch (e) {
			if (!(e instanceof Error)) {
				console.error("threw non-Error instance", e);
				throw e;
			}
			dataFromServer = e;

			state.result = e;
			state.argsForLastResult = args;
			const copy = structuredClone(e);
			state.lastResult = copy;
		}
		return dataFromServer;
	}

	/*
	 ** compute async result **
	 * Return value or undefined; never an error object.
	 */
	let asyncResult = $state<FunctionReturnType<Action> | undefined>(undefined);
	$effect(() => {
		if (isSkipped) {
			asyncResult = undefined;
			return;
		}

		runAction(currentArgs).then((value) => {
			asyncResult = value;
		});
	});

	const result = $derived.by(() => {
		return asyncResult !== undefined ? asyncResult : staleAllowed ? state.lastResult : undefined;
	});
	const isStale = $derived(
		!isSkipped &&
			asyncResult === undefined &&
			staleAllowed &&
			!sameArgsAsLastResult &&
			result !== undefined
	);
	const data = $derived.by(() => {
		if (result instanceof Error) return undefined;
		return result;
	});
	const error = $derived.by(() => {
		if (result instanceof Error) return result;
		return undefined;
	});

	/*
	 ** public shape **
	 * This TypeScript cast promises data is not undefined if error and isLoading are checked first.
	 */
	return {
		get data() {
			return data;
		},
		get isLoading() {
			return isSkipped ? false : error === undefined && data === undefined;
		},
		get error() {
			return error;
		},
		get isStale() {
			return isSkipped ? false : isStale;
		},
		async refetch(args?: FunctionArgs<Action>) {
			asyncResult = await runAction(args ?? currentArgs);
		}
	} as UseActionQueryReturn<Action>;
}
