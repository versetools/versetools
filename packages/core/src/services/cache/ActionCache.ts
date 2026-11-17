import {
	type DataModelFromSchemaDefinition,
	type defineSchema,
	defineTable,
	type FunctionArgs,
	type FunctionReference,
	type FunctionReturnType,
	type FunctionVisibility,
	type GenericActionCtx,
	getFunctionName
} from "convex/server";
import { v, type GenericId, type JSONValue } from "convex/values";

import { ActionCacheService } from "./ActionCacheService";
import type { ConvexRouter } from "../../routers";

const schema = {
	cachedActionValues: defineTable({
		name: v.string(),
		args: v.any(),
		value: v.any(),
		metadataId: v.optional(v.id("cachedActionMetadata"))
	}).index("by_key", ["name", "args"]),

	cachedActionMetadata: defineTable({
		valueId: v.id("cachedActionValues"),
		expiresAt: v.number()
	}).index("by_expiresAt", ["expiresAt"])
};

export type ActionCacheDataModel = DataModelFromSchemaDefinition<
	ReturnType<typeof defineSchema<typeof schema>>
>;

export type ActionCacheFunctionReferences = {
	get: FunctionReference<
		"query",
		"internal",
		{
			allowStale?: boolean | undefined;
			name: string;
			args: any;
			ttl: number | null;
		},
		ActionCacheResult<any>
	>;
	put: FunctionReference<
		"mutation",
		"internal",
		{
			expiredEntry?: GenericId<"cachedActionValues"> | undefined;
			name: string;
			args: any;
			value: any;
			ttl: number | null;
		},
		{
			cacheHit: boolean;
			deletedExpiredEntry: boolean;
		}
	>;
	remove: FunctionReference<
		"mutation",
		"internal",
		{
			name: string;
			args: any;
		},
		null
	>;
	removeAll: FunctionReference<
		"mutation",
		"internal",
		{
			name?: string | undefined;
			batchSize?: number | undefined;
			before?: number | undefined;
		},
		null
	>;
	purge: FunctionReference<
		"mutation",
		"internal",
		{
			expiresAt?: number | undefined;
		},
		null
	>;
};

export interface ActionCacheConfig<Action extends FunctionReference<"action", FunctionVisibility>> {
	/**
	 * The action that generates the cache values.
	 */
	action: Action;
	/**
	 * The name of the action cache. The name is part of the cache key and can be
	 * used for versioning. Defaults to the name of the action.
	 */
	name?: string;
	/**
	 * The maximum number of milliseconds this cache entry is valid for.
	 * If not provided, the cache entry will not automatically expire.
	 * This default can be overriden on a per-entry basis by calling `fetch`
	 * with the `ttl` option.
	 * If the TTL differs between when the cache entry was created and when it is
	 * fetched, the shorter of the TTLs will be used.
	 */
	ttl?: number;
	/**
	 * Whether to log cache hits and misses.
	 */
	log?: boolean;
}

export type ActionCacheResult<Action extends FunctionReference<"action", FunctionVisibility>> =
	| { kind: "hit"; value: FunctionReturnType<Action> }
	| { kind: "miss"; expiredEntry?: GenericId<"cachedActionValues"> };

export class ActionCache<Action extends FunctionReference<"action", FunctionVisibility>> {
	public static schema = schema;

	public static createRoutes<DataModel extends ActionCacheDataModel>(
		router: ConvexRouter<DataModel, any>
	) {
		const get = router
			.internalQuery({
				args: {
					name: v.string(),
					args: v.any(),
					ttl: v.union(v.float64(), v.null()),
					allowStale: v.boolean().optional()
				},
				returns: v.union(
					v.object({
						kind: v.literal("hit"),
						value: v.any()
					}),
					v.object({
						kind: v.literal("miss"),
						expiredEntry: v.id("cachedActionValues").optional()
					})
				)
			})
			.withDependencies(({ argsId }) => [argsId, ActionCacheService])
			.withHandler(async (args, cache): Promise<ActionCacheResult<any>> => {
				return await cache.get(args);
			});

		const put = router
			.internalMutation({
				args: {
					name: v.string(),
					args: v.any(),
					value: v.any(),
					ttl: v.union(v.float64(), v.null()),
					expiredEntry: v.id("cachedActionValues").optional()
				},
				returns: v.object({
					cacheHit: v.boolean(),
					deletedExpiredEntry: v.boolean()
				})
			})
			.withDependencies(({ argsId }) => [argsId, ActionCacheService])
			.withHandler(
				async (
					args,
					cache
				): Promise<{
					cacheHit: boolean;
					deletedExpiredEntry: boolean;
				}> => {
					return await cache.put(args);
				}
			);

		const remove = router
			.internalMutation({
				args: {
					name: v.string(),
					args: v.any()
				},
				returns: v.null()
			})
			.withDependencies(({ argsId }) => [argsId, ActionCacheService])
			.withHandler(async (args, cache): Promise<void> => {
				await cache.remove(args);
			});

		const removeAll = router
			.internalMutation({
				args: {
					name: v.string().optional(),
					batchSize: v.number().optional(),
					before: v.float64().optional()
				},
				returns: v.null()
			})
			.withDependencies(({ argsId }) => [argsId, ActionCacheService])
			.withHandler(async (args, cache): Promise<void> => {
				await cache.removeAll(args);
			});

		const purge = router
			.internalMutation({
				args: {
					expiresAt: v.float64().optional()
				},
				returns: v.null()
			})
			.withDependencies(({ argsId }) => [argsId, ActionCacheService])
			.withHandler(async (args, cache): Promise<void> => {
				await cache.purge(args);
			});

		return {
			get,
			put,
			remove,
			removeAll,
			purge
		};
	}

	/**
	 * The name of the action cache. The name is part of the cache key and can be
	 * used for versioning. Defaults to the name of the action.
	 */
	public name: string;
	/**
	 * A read-through cache wrapping an action. It calls the action on a miss.
	 * @param component - The registered action cache from `components`.
	 * @param config - The configuration for this action cache.
	 */
	constructor(
		private readonly functionReferences: ActionCacheFunctionReferences,
		private config: ActionCacheConfig<Action>
	) {
		this.name = this.config.name || getFunctionName(this.config.action);
	}

	/**
	 * Fetch the cache value for the given arguments, calling the action to create it
	 * if the value is expired or does not exist.
	 * @param ctx - The Convex action context.
	 * @param args - The arguments to the action that generates the cache values.
	 * @param opts - Optionally override the default cache TTL for this entry.
	 * @returns - The cache value
	 */
	async fetch(
		ctx: GenericActionCtx<any>,
		args: FunctionArgs<Action>,
		opts?: {
			/**
			 * How long to cache the value for. Overrides the default TTL.
			 */
			ttl?: number;
			/**
			 * Whether to force a cache miss.
			 * If true, the action will be called and the result will be cached.
			 * This can be useful if you want to update the cache before it expires.
			 */
			force?: boolean;
		}
	): Promise<FunctionReturnType<Action>> {
		const ttl = opts?.ttl ?? this.config.ttl ?? null;
		const result = await ctx.runQuery(this.functionReferences.get, {
			name: this.name,
			args,
			// If we're forcing a cache miss, we want to get the current value.
			ttl: opts?.force ? 0 : ttl
		});
		if (result.kind === "hit") {
			this.#log({ get: "hit" });
			return result.value as FunctionReturnType<Action>;
		}
		const value = await ctx.runAction(this.config.action, args);
		const putResult = await ctx.runMutation(this.functionReferences.put, {
			name: this.name,
			args,
			value,
			expiredEntry: result.expiredEntry,
			ttl
		});
		this.#log({
			get: "miss",
			put: putResult.cacheHit ? "hit" : putResult.deletedExpiredEntry ? "replaced" : "created"
		});
		return value as FunctionReturnType<Action>;
	}

	#log(args: Record<string, JSONValue>) {
		if (this.config.log) {
			console.log(
				JSON.stringify({
					type: "action-cache-stats",
					name: this.name,
					...args
				})
			);
		}
	}

	/**
	 * Get a value from the cache, returning null if it doesn't exist or has expired.
	 * It will consider the value expired if the original TTL has passed or if the
	 * value is older than the new TTL.
	 * @param ctx - The Convex context.
	 * @param args - The arguments to the action that generates the cache values.
	 * @param opts - Optionally override the default cache TTL for this entry.
	 * @returns - The cache value
	 */
	async get(
		ctx: GenericActionCtx<any>,
		args: FunctionArgs<Action>,
		opts?: {
			/**
			 * How long to cache the value for. Overrides the default TTL.
			 */
			ttl?: number;
			/**
			 * Whether to allow values that have expired to be returned.
			 */
			allowStale?: boolean;
		}
	): Promise<FunctionReturnType<Action> | null> {
		const ttl = opts?.ttl ?? this.config.ttl ?? null;

		const result: ActionCacheResult<Action> = await ctx.runQuery(this.functionReferences.get, {
			name: this.name,
			args,
			ttl,
			allowStale: opts?.allowStale
		});

		return result.kind === "hit" ? result.value : null;
	}

	/**
	 * Removes the cache value for the given arguments.
	 * @param ctx - The Convex mutation context.
	 * @param args - The arguments to the action the generates the cache values.
	 * @returns
	 */
	async remove(ctx: GenericActionCtx<any>, args: FunctionArgs<Action>) {
		return await ctx.runMutation(this.functionReferences.remove, {
			name: this.name,
			args
		});
	}

	/**
	 * Clear the cache of all values associated with the name of this `ActionCache`.
	 * @param ctx - The Convex mutation context.
	 * @param opts - Optionally override the default batch size.
	 */
	async clear(ctx: GenericActionCtx<any>, opts?: { batchSize?: number }) {
		return await ctx.runMutation(this.functionReferences.removeAll, {
			name: this.name,
			batchSize: opts?.batchSize
		});
	}
}
