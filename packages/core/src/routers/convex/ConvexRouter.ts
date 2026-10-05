import type { FunctionType, FunctionVisibility, GenericDataModel } from "convex/server";
import type { PropertyValidators } from "convex/values";

import { RouteBuilder, type RouteBuilderOptions } from "./RouteBuilder";
import type { Middleware } from "./types";
import type { HaywireGenericContainerFactory } from "../../haywire-types";

export class ConvexRouter<
	DataModel extends GenericDataModel,
	ContainerFactory extends HaywireGenericContainerFactory = HaywireGenericContainerFactory,
	RouteConfig extends Record<string, any> = object
> {
	private constructor(
		/** @internal */
		public readonly _containerFactory: ContainerFactory,
		/** @internal */
		public readonly _middlewarePipeline: Middleware<DataModel, any, any, any, any>[]
	) {}

	static fromContainerFactory<
		DataModel extends GenericDataModel,
		ContainerFactory extends HaywireGenericContainerFactory = HaywireGenericContainerFactory
	>(containerFactory: ContainerFactory) {
		return new ConvexRouter<DataModel, ContainerFactory>(containerFactory, []);
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
		OutputFactory extends HaywireGenericContainerFactory,
		MiddlewareConfig extends Record<string, any> = object
	>(
		middleware: Middleware<
			DataModel,
			ContainerFactory,
			ArgsValidator,
			OutputFactory,
			MiddlewareConfig
		>
	) {
		return new ConvexRouter<
			DataModel,
			OutputFactory,
			MiddlewareConfig extends Record<string, never> ? RouteConfig : RouteConfig & MiddlewareConfig
		>(this._containerFactory as unknown as OutputFactory, [
			...this._middlewarePipeline,
			middleware
		]);
	}

	createMiddleware<
		ArgsValidator extends PropertyValidators | void,
		OutputFactory extends HaywireGenericContainerFactory,
		MiddlewareConfig extends Record<string, any> = object
	>(
		middleware: Middleware<
			DataModel,
			ContainerFactory,
			ArgsValidator,
			OutputFactory,
			MiddlewareConfig
		>
	) {
		return middleware;
	}

	private route<
		Type extends FunctionType,
		Visibility extends FunctionVisibility,
		Options extends RouteBuilderOptions<any>
	>(functionType: Type, visibility: Visibility, options: Options) {
		return new RouteBuilder<
			DataModel,
			ConvexRouter<DataModel, ContainerFactory, RouteConfig>,
			Type,
			Visibility,
			Options
		>(this, functionType, visibility, options);
	}
}

export function convexRouter<
	DataModel extends GenericDataModel,
	ContainerFactory extends HaywireGenericContainerFactory = HaywireGenericContainerFactory
>(containerFactory: ContainerFactory) {
	return ConvexRouter.fromContainerFactory<DataModel, ContainerFactory>(containerFactory);
}
