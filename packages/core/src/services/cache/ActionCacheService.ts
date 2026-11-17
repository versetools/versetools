import { type DocumentByName, type GenericMutationCtx, type GenericQueryCtx } from "convex/server";
import { type GenericId } from "convex/values";

import type {
	ActionCacheDataModel,
	ActionCacheFunctionReferences,
	ActionCacheResult
} from "./ActionCache";
import { assert } from "../../errors";
import { isAction, isMutation, isQuery, type GenericCtx } from "../../helpers";

export class ActionCacheService {
	constructor(
		private readonly ctx: GenericCtx<ActionCacheDataModel>,
		private readonly functionReferences: ActionCacheFunctionReferences
	) {}

	/**
	 * @internal
	 * Get a value from the cache, returning null if it doesn't exist or has expired.
	 * It will consider the value expired if the original TTL has passed or if the
	 * value is older than the new TTL.
	 */
	async get(args: {
		name: string;
		args: any;
		ttl: number | null;
		allowStale?: boolean;
	}): Promise<ActionCacheResult<any>> {
		assert(isQuery(this.ctx), "Expected a query context");

		const match = await this.lookup(this.ctx, args);
		if (!match) {
			return { kind: "miss" } as const;
		}

		// Take the minimum of the existing TTL and the argument TTL, if provided.
		// Note that the background job will only cleanup entries according to their
		// original TTL.
		let expiresAt: number | null = null;
		if (match.metadataId) {
			const metadataDoc = await this.ctx.db.get("cachedActionMetadata", match.metadataId);
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
	 * @internal
	 * Put a value into the cache after observing a cache miss. This will update the
	 * cache entry if no one has touched it since we observed the miss.
	 *
	 * If ttl is non-null, it will set the expiration to that number of milliseconds from now.
	 * If ttl is null, it will never expire.
	 */
	async put(args: {
		name: string;
		args: any;
		value: any;
		ttl: number | null;
		expiredEntry?: GenericId<"cachedActionValues">;
	}): Promise<{
		cacheHit: boolean;
		deletedExpiredEntry: boolean;
	}> {
		assert(isMutation(this.ctx), "Expected a mutation context");

		const match = await this.lookup(this.ctx, args);

		// Try to reuse an existing entry if present.
		if (match && this.canReuseCacheEntry(args.expiredEntry, match, args.ttl)) {
			return { cacheHit: true, deletedExpiredEntry: false };
		}
		// Otherwise, delete the existing entry and insert a new one.
		if (match) {
			await this.del(this.ctx, match);
		}
		const valueId = await this.ctx.db.insert("cachedActionValues", {
			name: args.name,
			args: args.args,
			value: args.value
		});
		if (args.ttl !== null) {
			const expiresAt = Date.now() + args.ttl;
			const metadataId = await this.ctx.db.insert("cachedActionMetadata", {
				valueId,
				expiresAt
			});
			await this.ctx.db.patch("cachedActionValues", valueId, {
				metadataId
			});
		}
		return { cacheHit: false, deletedExpiredEntry: !!match };
	}

	/** @internal */
	async remove(args: { name: string; args: unknown }) {
		assert(isMutation(this.ctx), "Expected a mutation context");

		const match = await this.lookup(this.ctx, args);
		if (match) {
			await this.del(this.ctx, match);
		}
	}

	/**
	 * Clear all values in the cache.
	 * @param ctx - The Convex mutation context.
	 * @param opts - Optionally remove all values created before a timestamp or for a name.
	 * Defaults to now (all values).
	 * @returns
	 */
	async removeAll(opts: { name?: string; before?: number; batchSize?: number }) {
		assert(isMutation(this.ctx) || isAction(this.ctx), "Expected an action or mutation context");

		if (isAction(this.ctx)) {
			return this.ctx.runMutation(this.functionReferences.removeAll, opts);
		}

		const batchSize = opts.batchSize ?? 100;
		const query = opts.name
			? this.ctx.db.query("cachedActionValues").withIndex("by_key", (q) => q.eq("name", opts.name!))
			: this.ctx.db
					.query("cachedActionValues")
					.withIndex("by_creation_time", (q) => q.lte("_creationTime", opts.before ?? Date.now()));

		const matches = await query.order("desc").take(batchSize);
		for (const match of matches) {
			await this.del(this.ctx, match);
		}
		if (matches.length === batchSize) {
			await this.ctx.scheduler.runAfter(
				0,
				this.functionReferences.removeAll,
				opts.name ? { name: opts.name } : { before: matches[batchSize - 1]!._creationTime }
			);
		}
	}

	async purge(opts: { expiresAt?: number }) {
		assert(isMutation(this.ctx), "Expected a mutation context");

		const expiresAt = opts.expiresAt ?? Date.now();
		const valuesToDelete = await this.ctx.db
			.query("cachedActionMetadata")
			.withIndex("by_expiresAt", (q) => q.lte("expiresAt", expiresAt!))
			.order("desc")
			.take(10);

		const deletions = [];
		for (const value of valuesToDelete) {
			deletions.push(this.ctx.db.delete("cachedActionMetadata", value._id));
			deletions.push(this.ctx.db.delete("cachedActionValues", value.valueId));
		}
		await Promise.all(deletions);
		if (valuesToDelete.length === 10) {
			console.debug("[ActionCacheService] More than 10 values to delete, scheduling another purge");
			await this.ctx.scheduler.runAfter(0, this.functionReferences.purge, {
				expiresAt: expiresAt ? valuesToDelete[9].expiresAt : undefined
			});
		} else if (valuesToDelete.length > 0) {
			console.debug("[ActionCacheService] Cache purge complete");
		}
	}

	private canReuseCacheEntry(
		expiredEntry: GenericId<"cachedActionValues"> | undefined,
		existingEntry: DocumentByName<ActionCacheDataModel, "cachedActionValues">,
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

	private async lookup(
		ctx: GenericQueryCtx<ActionCacheDataModel>,
		args: { name: string; args: unknown }
	) {
		return ctx.db
			.query("cachedActionValues")
			.withIndex("by_key", (q) => q.eq("name", args.name).eq("args", args.args))
			.unique();
	}

	private async del(
		ctx: GenericMutationCtx<ActionCacheDataModel>,
		value: DocumentByName<ActionCacheDataModel, "cachedActionValues">
	) {
		if (value.metadataId) {
			await ctx.db.delete("cachedActionMetadata", value.metadataId);
		}
		await ctx.db.delete("cachedActionValues", value._id);
	}
}
