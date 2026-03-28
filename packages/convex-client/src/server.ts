import { err, ok, Result } from "@l3dev/result";
import { isConvexResultError } from "@versetools/core/errors";
import type { RequestEvent } from "@sveltejs/kit";
import { ConvexHttpClient, ConvexClient, type ConvexClientOptions } from "convex/browser";
import type {
	ArgsAndOptions,
	Expand,
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
	OptionalRestArgs
} from "convex/server";

declare const _onUpdate: ConvexClient["onUpdate"];
export type Subscription<Query extends FunctionReference<"query">> = ReturnType<
	typeof _onUpdate<Query>
>;

export type HttpMutationOptions = {
	/**
	 * Skip the default queue of mutations and run this immediately.
	 *
	 * This allows the same HttpConvexClient to be used to request multiple
	 * mutations in parallel, something not possible with WebSocket-based clients.
	 */
	skipQueue: boolean;
};

type ClientOptions = {
	url: string;
	token?: string;
	secret?: string;
};

type HttpClientOptions = Expand<
	Omit<ClientOptions & ConstructorParameters<typeof ConvexHttpClient>[1], "auth">
>;

type WebsocketClientOptions = Expand<
	ClientOptions &
		ConvexClientOptions & {
			refreshToken?: () => Promise<string>;
		}
>;

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

function wrapClient<T extends ConvexClient | ConvexHttpClient, TSecret extends string | undefined>(
	raw: T,
	secret: TSecret
) {
	return Object.assign(raw, {
		secret,
		safeQuery: async function <Query extends FunctionReference<"query">>(
			query: Query,
			args: FunctionArgs<Query>
		) {
			return Result.unwrap(await wrapConvexCall(() => raw.query(query, args)));
		},
		safeMutation: async function <Mutation extends FunctionReference<"mutation">>(
			mutation: Mutation,
			...[args, options]: ArgsAndOptions<Mutation, HttpMutationOptions>
		) {
			return Result.unwrap(await wrapConvexCall(() => raw.mutation(mutation, args, options)));
		},
		safeAction: async function <Action extends FunctionReference<"action">>(
			action: Action,
			...[args]: OptionalRestArgs<Action>
		) {
			return Result.unwrap(await wrapConvexCall(() => raw.action(action, args)));
		}
	});
}

export function createHttpClient<T extends HttpClientOptions>({
	url,
	token,
	secret,
	...options
}: T) {
	const httpClient = wrapClient(
		new ConvexHttpClient(url, {
			skipConvexDeploymentUrlCheck: true,
			auth: token,
			...options
		}),
		secret as T["secret"]
	);

	return Object.assign(httpClient, {
		asUser: function (userToken: string) {
			return createHttpClient({
				...options,
				url,
				token: userToken,
				secret
			});
		},
		withEvent: function (event: RequestEvent) {
			const token = (event.locals as { token?: string }).token;
			return token ? this.asUser(token) : httpClient;
		}
	});
}

export function createWebsocketClient<T extends WebsocketClientOptions>({
	url,
	token,
	secret,
	refreshToken,
	...options
}: T) {
	const wsClient = wrapClient(
		new ConvexClient(url, {
			skipConvexDeploymentUrlCheck: true,
			authRefreshTokenLeewaySeconds: 15,
			...options
		}),
		secret as T["secret"]
	);

	if (token) {
		wsClient.setAuth(async (forceRefreshToken) => {
			if (forceRefreshToken && refreshToken) {
				token = await refreshToken();
			}

			return token;
		});
	}

	return Object.assign(wsClient, {
		watch: function <Query extends FunctionReference<"query">>(
			query: Query,
			...[args]: OptionalRestArgs<Query>
		) {
			let resultCallback: (result: FunctionReturnType<Query>) => unknown;
			let errorCallback: ((error: Error) => unknown) | undefined = undefined;

			function subscribe(): Subscription<Query> {
				return wsClient.onUpdate(query, args, resultCallback, errorCallback);
			}

			function onResult(cb: typeof resultCallback) {
				resultCallback = cb;
				return {
					onError,
					subscribe
				};
			}

			function onError(cb: typeof errorCallback) {
				errorCallback = cb;
				return {
					onResult,
					subscribe
				};
			}

			return {
				onResult,
				onError
			};
		},
		asUser: function (userToken: string) {
			return createWebsocketClient({
				...options,
				url,
				token: userToken,
				secret
			});
		},
		withEvent: function (event: RequestEvent) {
			const token = (event.locals as { token?: string }).token;
			return token ? this.asUser(token) : wsClient;
		}
	});
}
