import { internal } from "$convex/_generated/api";
import type { Doc, Id } from "$convex/_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "$convex/_generated/server";
import { isAction } from "@versetools/core/helpers";
import {
	createFunctionHandle,
	type FunctionArgs,
	type FunctionReference,
	type FunctionReturnType,
	type FunctionVisibility,
	getFunctionName
} from "convex/server";
import type { JSONValue } from "convex/values";

import type { GenericCtx } from "../dataModel";

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
	| { kind: "miss"; expiredEntry?: Id<"cachedActionValues"> };

export class ActionCache<Action extends FunctionReference<"action", FunctionVisibility>> {
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
	constructor(private config: ActionCacheConfig<Action>) {
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
		ctx: ActionCtx,
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
		const fn = await createFunctionHandle(this.config.action);
		const ttl = opts?.ttl ?? this.config.ttl ?? null;
		const result = await ctx.runQuery(internal.server.cache.actions.get, {
			name: this.name,
			args,
			// If we're forcing a cache miss, we want to get the current value.
			ttl: opts?.force ? 0 : ttl
		});
		if (result.kind === "hit") {
			this.#log({ get: "hit" });
			return result.value as FunctionReturnType<Action>;
		}
		const value = await ctx.runAction(fn, args);
		const putResult = await ctx.runMutation(internal.server.cache.actions.put, {
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
		ctx: GenericCtx,
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

		let result: ActionCacheResult<Action>;
		if (isAction(ctx)) {
			result = await ctx.runQuery(internal.server.cache.actions.get, {
				name: this.name,
				args,
				ttl,
				allowStale: opts?.allowStale
			});
		} else {
			result = await ActionCache.get(ctx, {
				name: this.name,
				args,
				ttl,
				allowStale: opts?.allowStale
			});
		}

		return result.kind === "hit" ? result.value : null;
	}

	/**
	 * Removes the cache value for the given arguments.
	 * @param ctx - The Convex mutation context.
	 * @param args - The arguments to the action the generates the cache values.
	 * @returns
	 */
	async remove(ctx: MutationCtx | ActionCtx, args: FunctionArgs<Action>) {
		if (isAction(ctx)) {
			return await ctx.runMutation(internal.server.cache.actions.remove, {
				name: this.name,
				args
			});
		}

		await ActionCache.remove(ctx, {
			name: this.name,
			args
		});
	}

	/**
	 * Clear the cache of all values associated with the name of this `ActionCache`.
	 * @param ctx - The Convex mutation context.
	 * @param opts - Optionally override the default batch size.
	 */
	async clear(ctx: MutationCtx | ActionCtx, opts?: { batchSize?: number }) {
		return ActionCache.removeAll(ctx, {
			name: this.name,
			batchSize: opts?.batchSize
		});
	}

	/**
	 * Clear all values in the cache.
	 * @param ctx - The Convex mutation context.
	 * @param opts - Optionally remove all values created before a timestamp or for a name.
	 * Defaults to now (all values).
	 * @returns
	 */
	static async removeAll(
		ctx: MutationCtx | ActionCtx,
		opts: { name?: string; before?: number; batchSize?: number }
	) {
		if (isAction(ctx)) {
			return ctx.runMutation(internal.server.cache.actions.removeAll, opts);
		}

		const batchSize = opts.batchSize ?? 100;
		const query = opts.name
			? ctx.db.query("cachedActionValues").withIndex("by_key", (q) => q.eq("name", opts.name!))
			: ctx.db
					.query("cachedActionValues")
					.withIndex("by_creation_time", (q) => q.lte("_creationTime", opts.before ?? Date.now()));

		const matches = await query.order("desc").take(batchSize);
		for (const match of matches) {
			await this.del(ctx, match);
		}
		if (matches.length === batchSize) {
			await ctx.scheduler.runAfter(
				0,
				internal.server.cache.actions.removeAll,
				opts.name ? { name: opts.name } : { before: matches[batchSize - 1]!._creationTime }
			);
		}
	}

	/**
	 * Get a value from the cache, returning null if it doesn't exist or has expired.
	 * It will consider the value expired if the original TTL has passed or if the
	 * value is older than the new TTL.
	 * @internal
	 */
	static async get(
		ctx: QueryCtx,
		args: {
			name: string;
			args: any;
			ttl: number | null;
			allowStale?: boolean;
		}
	): Promise<ActionCacheResult<any>> {
		const match = await this.lookup(ctx, args);
		if (!match) {
			return { kind: "miss" } as const;
		}

		// Take the minimum of the existing TTL and the argument TTL, if provided.
		// Note that the background job will only cleanup entries according to their
		// original TTL.
		let expiresAt: number | null = null;
		if (match.metadataId) {
			const metadataDoc = await ctx.db.get(match.metadataId);
			expiresAt = metadataDoc?.expiresAt ?? null;
		}
		if (args.ttl !== undefined && args.ttl !== null) {
			expiresAt = Math.min(expiresAt ?? Infinity, match._creationTime + args.ttl);
		}
		if (!args.allowStale && expiresAt && expiresAt <= Date.now()) {
			return { kind: "miss", expiredEntry: match._id } as const;
		}
		return { kind: "hit", value: match.value } as const;
	}

	/**
	 * Put a value into the cache after observing a cache miss. This will update the
	 * cache entry if no one has touched it since we observed the miss.
	 *
	 * If ttl is non-null, it will set the expiration to that number of milliseconds from now.
	 * If ttl is null, it will never expire.
	 * @internal
	 */
	static async put(
		ctx: MutationCtx,
		args: {
			name: string;
			args: any;
			value: any;
			ttl: number | null;
			expiredEntry?: Id<"cachedActionValues">;
		}
	): Promise<{
		cacheHit: boolean;
		deletedExpiredEntry: boolean;
	}> {
		const match = await this.lookup(ctx, args);

		// Try to reuse an existing entry if present.
		if (match && this.canReuseCacheEntry(args.expiredEntry, match, args.ttl)) {
			return { cacheHit: true, deletedExpiredEntry: false };
		}
		// Otherwise, delete the existing entry and insert a new one.
		if (match) {
			await this.del(ctx, match);
		}
		const valueId = await ctx.db.insert("cachedActionValues", {
			name: args.name,
			args: args.args,
			value: args.value
		});
		if (args.ttl !== null) {
			const expiresAt = Date.now() + args.ttl;
			const metadataId = await ctx.db.insert("cachedActionMetadata", {
				valueId,
				expiresAt
			});
			await ctx.db.patch(valueId, {
				metadataId
			});
		}
		return { cacheHit: false, deletedExpiredEntry: !!match };
	}

	/** @internal */
	static async remove(ctx: MutationCtx, args: { name: string; args: unknown }) {
		const match = await ActionCache.lookup(ctx, args);
		if (match) {
			await ActionCache.del(ctx, match);
		}
	}

	/** @internal */
	static canReuseCacheEntry(
		expiredEntry: Id<"cachedActionValues"> | undefined,
		existingEntry: Doc<"cachedActionValues">,
		ttl: number | null
	) {
		// If we're setting a TTL and the previous entry doesn't have one, we can't reuse it.
		if (!existingEntry.metadataId && ttl !== null) {
			return false;
		}
		// Similarly, if we don't have a TTL and the previous entry does, we can't reuse it.
		if (existingEntry.metadataId && ttl === null) {
			return false;
		}
		// Don't reuse the entry we previously observed as expired.
		if (expiredEntry && existingEntry._id === expiredEntry) {
			return false;
		}
		return true;
	}

	/** @internal */
	static async lookup(ctx: QueryCtx, args: { name: string; args: unknown }) {
		return ctx.db
			.query("cachedActionValues")
			.withIndex("by_key", (q) => q.eq("name", args.name).eq("args", args.args))
			.unique();
	}

	/** @internal */
	static async del(ctx: MutationCtx, value: Doc<"cachedActionValues">) {
		if (value.metadataId) {
			await ctx.db.delete(value.metadataId);
		}
		await ctx.db.delete(value._id);
	}
}
