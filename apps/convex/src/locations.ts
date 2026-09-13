import { NONE, type Err, type None } from "@l3dev/result";
import { ResultError } from "@versetools/core/errors";
import {
	AbortLocationImportSchema,
	BeginLocationImportSchema,
	CreateLocationSchema,
	FinalizeLocationImportSchema,
	ReconcileLocationImportBatchSchema,
	UpdateLocationSchema
} from "@versetools/types";
import { v } from "convex/values";

import { AbortLocationImportMutation } from "$convex/app/commands/locations/AbortLocationImportMutation";
import { ActiveLocationClosureRebuildQuery } from "$convex/app/commands/locations/ActiveLocationClosureRebuildQuery";
import { BeginLocationImportMutation } from "$convex/app/commands/locations/BeginLocationImportMutation";
import { CreateLocationMutation } from "$convex/app/commands/locations/CreateLocationMutation";
import { FinalizeLocationImportMutation } from "$convex/app/commands/locations/FinalizeLocationImportMutation";
import {
	LocationTreeQuery,
	type LocationWithChildren
} from "$convex/app/commands/locations/LocationTreeQuery";
import { RebuildLocationClosuresMutation } from "$convex/app/commands/locations/RebuildLocationClosuresMutation";
import { ReconcileLocationImportBatchMutation } from "$convex/app/commands/locations/ReconcileLocationImportBatchMutation";
import { RemoveLocationMutation } from "$convex/app/commands/locations/RemoveLocationMutation";
import { RootLocationsQuery } from "$convex/app/commands/locations/RootLocationsQuery";
import { UpdateLocationMutation } from "$convex/app/commands/locations/UpdateLocationMutation";
import { router } from "$convex/app/main";
import { secretKeyMiddleware } from "$convex/app/middleware/secretKeyMiddleware";

export const list = router
	.query({ args: { rootIds: v.optional(v.array(v.id("locations"))) } })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args): Promise<LocationWithChildren[]> => {
		if (await runner.query(new ActiveLocationClosureRebuildQuery())) {
			throw new ResultError("LOCATION_TREE_REBUILDING");
		}
		const rootIds =
			args.rootIds ??
			(await runner.query(new RootLocationsQuery())).map((location) => location._id);
		return await runner.mapQuery(rootIds, (rootId) => new LocationTreeQuery(rootId));
	});

export const isRebuilding = router
	.query({})
	.withDependencies(({ runnerId }) => [runnerId])
	.withHandler(async (runner) => !!(await runner.query(new ActiveLocationClosureRebuildQuery())));

export const create = router
	.internalMutation({ validator: "zod", args: CreateLocationSchema })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args): Promise<None> => {
		await runner.mutation(new CreateLocationMutation(args));
		return NONE;
	});

export const update = router
	.internalMutation({ validator: "zod", args: UpdateLocationSchema })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args): Promise<None | Err<"LOCATION_NOT_FOUND", null>> => {
		if (!(await runner.mutation(new UpdateLocationMutation(args)))) {
			throw new ResultError("LOCATION_NOT_FOUND");
		}
		return NONE;
	});

export const remove = router
	.internalMutation({ args: { id: v.id("locations") } })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args): Promise<None | Err<"LOCATION_NOT_FOUND", null>> => {
		if (!(await runner.mutation(new RemoveLocationMutation(args.id)))) {
			throw new ResultError("LOCATION_NOT_FOUND");
		}
		return NONE;
	});

export const beginImport = router
	.withMiddleware(secretKeyMiddleware())
	.mutation({ validator: "zod", args: BeginLocationImportSchema })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(
		async (runner, args) => await runner.mutation(new BeginLocationImportMutation(args))
	);

export const reconcileImportBatch = router
	.withMiddleware(secretKeyMiddleware())
	.mutation({ validator: "zod", args: ReconcileLocationImportBatchSchema })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args) => {
		await runner.mutation(new ReconcileLocationImportBatchMutation(args));
		return NONE;
	});

export const abortImport = router
	.withMiddleware(secretKeyMiddleware())
	.mutation({ validator: "zod", args: AbortLocationImportSchema })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args) => {
		await runner.mutation(new AbortLocationImportMutation(args));
		return NONE;
	});

export const rebuildImportClosures = router
	.withMiddleware(secretKeyMiddleware())
	.mutation({ args: { generationId: v.id("locationImportGenerations") } })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args) => ({
		done: await runner.mutation(new RebuildLocationClosuresMutation(args.generationId))
	}));

export const rebuildClosures = router
	.internalMutation({})
	.withDependencies(({ runnerId }) => [runnerId])
	.withHandler(async (runner) => ({
		done: await runner.mutation(new RebuildLocationClosuresMutation(null))
	}));

export const finalizeImport = router
	.withMiddleware(secretKeyMiddleware())
	.mutation({ validator: "zod", args: FinalizeLocationImportSchema })
	.withDependencies(({ runnerId, argsId }) => [runnerId, argsId])
	.withHandler(async (runner, args) => ({
		done: await runner.mutation(new FinalizeLocationImportMutation(args))
	}));
