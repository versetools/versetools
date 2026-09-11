import { NONE, type Err, type None } from "@l3dev/result";
import { ResultError } from "@versetools/core/errors";
import { CreateLocationSchema, UpdateLocationSchema } from "@versetools/types";
import { v } from "convex/values";

import { CreateLocationMutation } from "$convex/app/commands/locations/CreateLocationMutation";
import { DeleteLocationMutation } from "$convex/app/commands/locations/DeleteLocationMutation";
import {
	LocationTreeQuery,
	type LocationWithChildren
} from "$convex/app/commands/locations/LocationTreeQuery";
import { MoveLocationMutation } from "$convex/app/commands/locations/MoveLocationMutation";
import { RootLocationsQuery } from "$convex/app/commands/locations/RootLocationsQuery";
import { UpdateLocationDataMutation } from "$convex/app/commands/locations/UpdateLocationDataMutation";
import { router } from "$convex/app/main";

export const list = router
	.query({
		args: {
			rootIds: v.optional(v.array(v.id("locations")))
		}
	})
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args): Promise<LocationWithChildren[]> => {
		const rootIds = args.rootIds
			? args.rootIds
			: (await runner.query(new RootLocationsQuery())).map((l) => l._id);

		return await runner.mapQuery(
			rootIds,
			(rootId): LocationTreeQuery => new LocationTreeQuery(rootId)
		);
	});

export const create = router
	.internalMutation({
		validator: "zod",
		args: CreateLocationSchema
	})
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args): Promise<None> => {
		await runner.mutation(new CreateLocationMutation(args));
		return NONE;
	});

export const update = router
	.internalMutation({
		validator: "zod",
		args: UpdateLocationSchema
	})
	.withDependencies(({ ctxId, runnerId, argsId }) => [ctxId, runnerId, argsId])
	.withHandler(async (ctx, runner, args): Promise<None | Err<"LOCATION_NOT_FOUND", null>> => {
		const existing = await ctx.db.get("locations", args.id);
		if (!existing) {
			throw new ResultError("LOCATION_NOT_FOUND");
		}

		await runner.mutation(new UpdateLocationDataMutation(existing, args));

		if (args.parentId !== undefined && existing.parentId !== args.parentId) {
			await runner.mutation(new MoveLocationMutation(existing, args.parentId));
		}

		return NONE;
	});

export const remove = router
	.internalMutation({
		args: {
			id: v.id("locations")
		}
	})
	.withDependencies(({ ctxId, runnerId, argsId }) => [ctxId, runnerId, argsId])
	.withHandler(async (ctx, runner, args): Promise<None | Err<"LOCATION_NOT_FOUND", null>> => {
		const existing = await ctx.db.get("locations", args.id);
		if (!existing) {
			throw new ResultError("LOCATION_NOT_FOUND");
		}

		await runner.mutation(new DeleteLocationMutation(existing));
		return NONE;
	});
