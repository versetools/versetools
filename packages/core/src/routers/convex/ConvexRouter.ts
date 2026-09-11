import type { FunctionType, FunctionVisibility, GenericDataModel } from "convex/server";
import type { PropertyValidators } from "convex/values";

import { RouteBuilder, type RouteBuilderOptions } from "./RouteBuilder";
import type { GenericHaywireFactory } from "../../haywire-types";
import type { Middleware } from "./types";

export class ConvexRouter<
	DataModel extends GenericDataModel,
	Factory extends GenericHaywireFactory = GenericHaywireFactory,
	RouteConfig extends Record<string, any> = object
> {
	private constructor(
		/** @internal */
		public readonly _factory: Factory,
		/** @internal */
		public readonly _middlewarePipeline: Middleware<DataModel, any, any, any, any>[]
	) {}

	static fromFactory<
		DataModel extends GenericDataModel,
		Factory extends GenericHaywireFactory = GenericHaywireFactory
	>(factory: Factory) {
		return new ConvexRouter<DataModel, Factory>(factory, []);
	}

	query<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("query", "public", options);
	}

	internalQuery<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("query", "internal", options);
	}

	mutation<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("mutation", "public", options);
	}

	internalMutation<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("mutation", "internal", options);
	}

	action<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("action", "public", options);
	}

	internalAction<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("action", "internal", options);
	}

	withMiddleware<
		ArgsValidator extends PropertyValidators | void,
		OutputFactory extends GenericHaywireFactory,
		MiddlewareConfig extends Record<string, any> = object
	>(middleware: Middleware<DataModel, Factory, ArgsValidator, OutputFactory, MiddlewareConfig>) {
		return new ConvexRouter<
			DataModel,
			OutputFactory,
			MiddlewareConfig extends Record<string, never> ? RouteConfig : RouteConfig & MiddlewareConfig
		>(this._factory as unknown as OutputFactory, [...this._middlewarePipeline, middleware]);
	}

	createMiddleware<
		ArgsValidator extends PropertyValidators | void,
		OutputFactory extends GenericHaywireFactory,
		MiddlewareConfig extends Record<string, any> = object
	>(middleware: Middleware<DataModel, Factory, ArgsValidator, OutputFactory, MiddlewareConfig>) {
		return middleware;
	}

	private route<
		Type extends FunctionType,
		Visibility extends FunctionVisibility,
		Options extends RouteBuilderOptions<any>
	>(functionType: Type, visibility: Visibility, options: Options) {
		return new RouteBuilder<
			DataModel,
			ConvexRouter<DataModel, Factory, RouteConfig>,
			Type,
			Visibility,
			Options
		>(this, functionType, visibility, options);
	}
}

export function convexRouter<
	DataModel extends GenericDataModel,
	Factory extends GenericHaywireFactory = GenericHaywireFactory
>(factory: Factory) {
	return ConvexRouter.fromFactory<DataModel, Factory>(factory);
}
