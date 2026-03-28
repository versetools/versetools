import { NONE, type Err, type None } from "@l3dev/result";
import { ResultError } from "@versetools/core/errors";
import { CreateGameLocationSchema, UpdateGameLocationSchema } from "@versetools/types";
import { v } from "convex/values";
import { zid } from "convex-helpers/server/zod4";

import { CreateLocationMutation } from "$convex/app/commands/locations/CreateLocationMutation";
import { DeleteLocationMutation } from "$convex/app/commands/locations/DeleteLocationMutation";
import {
	LocationTreeQuery,
	type LocationWithChildren
} from "$convex/app/commands/locations/LocationTreeQuery";
import { MoveLocationMutation } from "$convex/app/commands/locations/MoveLocationMutation";
import { RootLocationsQuery } from "$convex/app/commands/locations/RootLocationsQuery";
import { UpdateLocationDataMutation } from "$convex/app/commands/locations/UpdateLocationDataMutation";
import { zInternalMutation } from "$convex/app/functions";
import { runner } from "$convex/app/main";

import { query } from "./_generated/server";

export const list = query({
	args: {
		rootIds: v.optional(v.array(v.id("gameLocations")))
	},
	handler: async (ctx, args): Promise<LocationWithChildren[]> => {
		const rootIds = args.rootIds
			? args.rootIds
			: (await runner.query(ctx, new RootLocationsQuery())).map((l) => l._id);

		return await runner.mapQuery(
			ctx,
			rootIds,
			(rootId): LocationTreeQuery => new LocationTreeQuery(rootId)
		);
	}
});

export const create = zInternalMutation({
	args: CreateGameLocationSchema,
	handler: async (ctx, args): Promise<None> => {
		await runner.mutation(ctx, new CreateLocationMutation(args));
		return NONE;
	}
});

export const update = zInternalMutation({
	args: UpdateGameLocationSchema,
	handler: async (ctx, args): Promise<None | Err<"LOCATION_NOT_FOUND", null>> => {
		const existing = await ctx.db.get("gameLocations", args.id);
		if (!existing) {
			throw new ResultError("LOCATION_NOT_FOUND");
		}

		await runner.mutation(ctx, new UpdateLocationDataMutation(existing, args));

		if (args.parentId !== undefined && existing.parentId !== args.parentId) {
			await runner.mutation(ctx, new MoveLocationMutation(existing, args.parentId));
		}

		return NONE;
	}
});

export const remove = zInternalMutation({
	args: {
		id: zid("gameLocations")
	},
	handler: async (ctx, args): Promise<None | Err<"LOCATION_NOT_FOUND", null>> => {
		const existing = await ctx.db.get("gameLocations", args.id);
		if (!existing) {
			throw new ResultError("LOCATION_NOT_FOUND");
		}

		await runner.mutation(ctx, new DeleteLocationMutation(existing));
		return NONE;
	}
});
