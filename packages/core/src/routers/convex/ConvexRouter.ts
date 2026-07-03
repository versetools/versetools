import type { GenericDataModel } from "convex/server";
import { type Factory as HaywireFactory } from "haywire";

import { RouteBuilder, type RouteBuilderOptions } from "./RouteBuilder";
import type { GenericHaywireFactory } from "../../haywire-types";
import type { GenericCtx } from "../../helpers";

type GenericMiddleware<DataModel extends GenericDataModel> = (
	ctx: GenericCtx<DataModel>,
	factory: GenericHaywireFactory
) => GenericHaywireFactory;

export class ConvexRouter<
	DataModel extends GenericDataModel,
	Factory extends GenericHaywireFactory = GenericHaywireFactory
> {
	private constructor(
		/** @internal */
		public readonly _factory: Factory,
		/** @internal */
		public readonly _middlewareStack: GenericMiddleware<DataModel>[]
	) {}

	static fromFactory<
		DataModel extends GenericDataModel,
		Factory extends GenericHaywireFactory = GenericHaywireFactory
	>(factory: Factory) {
		return new ConvexRouter<DataModel, Factory>(factory, []);
	}

	query<Options extends RouteBuilderOptions>(options: Options) {
		return new RouteBuilder(this, "query", "public", options);
	}

	internalQuery<Options extends RouteBuilderOptions>(options: Options) {
		return new RouteBuilder(this, "query", "internal", options);
	}

	mutation<Options extends RouteBuilderOptions>(options: Options) {
		return new RouteBuilder(this, "mutation", "public", options);
	}

	internalMutation<Options extends RouteBuilderOptions>(options: Options) {
		return new RouteBuilder(this, "mutation", "internal", options);
	}

	action<Options extends RouteBuilderOptions>(options: Options) {
		return new RouteBuilder(this, "action", "public", options);
	}

	internalAction<Options extends RouteBuilderOptions>(options: Options) {
		return new RouteBuilder(this, "action", "internal", options);
	}

	withMiddleware<NewFactory extends HaywireFactory<any, any, any, any>>(
		middleware: (ctx: GenericCtx<DataModel>, factory: Factory) => NewFactory
	) {
		return new ConvexRouter<DataModel, NewFactory>(this._factory as unknown as NewFactory, [
			...this._middlewareStack,
			middleware as unknown as GenericMiddleware<DataModel>
		]);
	}
}

export function convexRouter<
	DataModel extends GenericDataModel,
	Factory extends GenericHaywireFactory = GenericHaywireFactory
>(factory: Factory) {
	return ConvexRouter.fromFactory<DataModel, Factory>(factory);
}
