import type { FunctionType, FunctionVisibility, GenericDataModel } from "convex/server";
import type { PropertyValidators } from "convex/values";
import type { EmptyObject } from "convex-helpers";

import { MiddlewareBuilder } from "./MiddlewareBuilder";
import { RouteBuilder, type RouteBuilderOptions } from "./RouteBuilder";
import {
	unsafeMiddlewarePipeline,
	unsafeRouterContainerFactory,
	type middlewareArgsType
} from "./symbols";
import type { Middleware, MiddlewareBuilderOptions } from "./types";
import type { HaywireGenericContainerFactory } from "../../haywire-types";

export class ConvexRouter<
	DataModel extends GenericDataModel,
	ContainerFactory extends HaywireGenericContainerFactory = HaywireGenericContainerFactory,
	RouteConfig extends Record<string, any> = object,
	MiddlewareArgs extends PropertyValidators = {}
> {
	declare public readonly [middlewareArgsType]: MiddlewareArgs;

	public readonly [unsafeRouterContainerFactory]: ContainerFactory;
	public readonly [unsafeMiddlewarePipeline]: Middleware<DataModel, any, any, any, any, any>[];

	private constructor(
		containerFactory: ContainerFactory,
		middlewarePipeline: Middleware<DataModel, any, any, any, any, any>[]
	) {
		this[unsafeRouterContainerFactory] = containerFactory;
		this[unsafeMiddlewarePipeline] = middlewarePipeline;
	}

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
		OutputContainerFactory extends HaywireGenericContainerFactory,
		BinderConfig extends Record<string, any> = object,
		HandlerConfig extends Record<string, any> = object
	>(
		middleware: Middleware<
			DataModel,
			ArgsValidator,
			ContainerFactory,
			OutputContainerFactory,
			BinderConfig,
			HandlerConfig
		>
	) {
		return new ConvexRouter<
			DataModel,
			OutputContainerFactory,
			RouteConfig &
				(BinderConfig extends EmptyObject ? {} : BinderConfig) &
				(HandlerConfig extends EmptyObject ? {} : HandlerConfig),
			MiddlewareArgs & (ArgsValidator extends PropertyValidators ? ArgsValidator : {})
		>(this[unsafeRouterContainerFactory] as unknown as OutputContainerFactory, [
			...this[unsafeMiddlewarePipeline],
			middleware
		]);
	}

	createMiddleware<Options extends MiddlewareBuilderOptions>(options: Options) {
		return new MiddlewareBuilder<DataModel, Options, ContainerFactory>(options);
	}

	private route<
		Type extends FunctionType,
		Visibility extends FunctionVisibility,
		Options extends RouteBuilderOptions<any>
	>(functionType: Type, visibility: Visibility, options: Options) {
		return new RouteBuilder<
			DataModel,
			ConvexRouter<DataModel, ContainerFactory, RouteConfig, MiddlewareArgs>,
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
