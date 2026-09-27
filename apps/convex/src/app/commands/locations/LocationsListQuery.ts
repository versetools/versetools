import { QueryCommand } from "@versetools/core/commands";
import { ResultError } from "@versetools/core/errors";
import type { LocationResponse } from "@versetools/types";

import type { DataModel, Id } from "$convex/_generated/dataModel";
import type { QueryableCtx } from "$convex/app/dataModel";
import { LocationTransformer } from "$convex/app/transformers/LocationTransformer";

import { ActiveLocationClosureRebuildQuery } from "./ActiveLocationClosureRebuildQuery";
import { AllLocationPropertiesQuery } from "./AllLocationPropertiesQuery";
import { LocationTreeQuery } from "./LocationTreeQuery";
import { RootLocationsQuery } from "./RootLocationsQuery";

export class LocationsListQuery extends QueryCommand<DataModel> {
	constructor(readonly rootIds?: Id<"locations">[]) {
		super();
	}

	async execute(_ctx: QueryableCtx): Promise<LocationResponse[]> {
		if (await this.runner.query(new ActiveLocationClosureRebuildQuery())) {
			throw new ResultError("LOCATION_TREE_REBUILDING");
		}
		const rootIds =
			this.rootIds ??
			(await this.runner.query(new RootLocationsQuery())).map((location) => location._id);
		const [trees, properties] = await Promise.all([
			this.runner.mapQuery(rootIds, (rootId) => new LocationTreeQuery(rootId)),
			this.runner.query(new AllLocationPropertiesQuery())
		]);
		const propertiesByLocationId = LocationTransformer.groupProperties(properties);
		return trees.map((tree) => LocationTransformer.transform(tree, propertiesByLocationId));
	}
}
