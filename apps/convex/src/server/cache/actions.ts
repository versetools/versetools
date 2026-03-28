import { v } from "convex/values";

import { internal } from "$convex/_generated/api";
import { internalMutation, internalQuery } from "$convex/_generated/server";
import { ActionCache, type ActionCacheResult } from "$convex/app/cache";

export const get = internalQuery({
	args: {
		name: v.string(),
		args: v.any(),
		ttl: v.union(v.float64(), v.null()),
		allowStale: v.optional(v.boolean())
	},
	returns: v.union(
		v.object({
			kind: v.literal("hit"),
			value: v.any()
		}),
		v.object({
			kind: v.literal("miss"),
			expiredEntry: v.optional(v.id("cachedActionValues"))
		})
	),
	handler: async (ctx, args): Promise<ActionCacheResult<any>> => {
		return await ActionCache.get(ctx, args);
	}
});

export const put = internalMutation({
	args: {
		name: v.string(),
		args: v.any(),
		value: v.any(),
		ttl: v.union(v.float64(), v.null()),
		expiredEntry: v.optional(v.id("cachedActionValues"))
	},
	returns: v.object({
		cacheHit: v.boolean(),
		deletedExpiredEntry: v.boolean()
	}),
	handler: async (
		ctx,
		args
	): Promise<{
		cacheHit: boolean;
		deletedExpiredEntry: boolean;
	}> => {
		return await ActionCache.put(ctx, args);
	}
});

export const remove = internalMutation({
	args: {
		name: v.string(),
		args: v.any()
	},
	returns: v.null(),
	handler: async (ctx, args): Promise<void> => {
		await ActionCache.remove(ctx, args);
	}
});

export const removeAll = internalMutation({
	args: {
		name: v.optional(v.string()),
		batchSize: v.optional(v.number()),
		before: v.optional(v.float64())
	},
	returns: v.null(),
	handler: async (ctx, args): Promise<void> => {
		await ActionCache.removeAll(ctx, args);
	}
});

export const purge = internalMutation({
	args: {
		expiresAt: v.optional(v.float64())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const expiresAt = args.expiresAt ?? Date.now();
		const valuesToDelete = await ctx.db
			.query("cachedActionMetadata")
			.withIndex("by_expiresAt", (q) => q.lte("expiresAt", expiresAt!))
			.order("desc")
			.take(10);

		const deletions = [];
		for (const value of valuesToDelete) {
			deletions.push(ctx.db.delete("cachedActionMetadata", value._id));
			deletions.push(ctx.db.delete("cachedActionValues", value.valueId));
		}
		await Promise.all(deletions);
		if (valuesToDelete.length === 10) {
			console.debug("More than 10 values to delete, scheduling another purge");
			await ctx.scheduler.runAfter(0, internal.server.cache.actions.purge, {
				expiresAt: expiresAt ? valuesToDelete[9].expiresAt : undefined
			});
		} else if (valuesToDelete.length > 0) {
			console.debug("Cache purge complete");
		}
	}
});
