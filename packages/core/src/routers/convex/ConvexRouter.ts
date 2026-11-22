import type { FunctionType, FunctionVisibility, GenericDataModel } from "convex/server";
import type { PropertyValidators } from "convex/values";
import type { EmptyObject } from "convex-helpers";
import { createContainerFactory } from "haywire";

import { acquireContainer, type BuiltContainerFromModule } from "./container";
import { MiddlewareBuilder } from "./MiddlewareBuilder";
import { RouteBuilder, type RouteBuilderOptions } from "./RouteBuilder";
import { unsafeMiddlewarePipeline, unsafeRouterModule, type middlewareArgsType } from "./symbols";
import type { Middleware, MiddlewareBuilderOptions } from "./types";
import type { HaywireGenericContainerFactory, HaywireGenericModule } from "../../haywire-types";
import type { GenericCtx } from "../../helpers";

export class ConvexRouter<
	DataModel extends GenericDataModel,
	Module extends HaywireGenericModule,
	RouteConfig extends Record<string, any> = object,
	MiddlewareArgs extends PropertyValidators = {}
> {
	declare public readonly [middlewareArgsType]: MiddlewareArgs;

	public readonly [unsafeRouterModule]: Module;
	public readonly [unsafeMiddlewarePipeline]: Middleware<DataModel, any, any, any, any, any>[];

	private constructor(
		module: Module,
		middlewarePipeline: Middleware<DataModel, any, any, any, any, any>[]
	) {
		this[unsafeRouterModule] = module;
		this[unsafeMiddlewarePipeline] = middlewarePipeline;
	}

	static fromModule<
		DataModel extends GenericDataModel,
		Module extends HaywireGenericModule = HaywireGenericModule
	>(module: Module) {
		return new ConvexRouter<DataModel, Module>(module, []);
	}

	public acquireContainer(ctx: GenericCtx<DataModel>) {
		return acquireContainer(
			createContainerFactory(this[unsafeRouterModule]),
			ctx as any
		) as BuiltContainerFromModule<Module>;
	}

	public query<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("query", "public", options);
	}

	public internalQuery<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("query", "internal", options);
	}

	public mutation<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("mutation", "public", options);
	}

	public internalMutation<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("mutation", "internal", options);
	}

	public action<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("action", "public", options);
	}

	public internalAction<Options extends RouteBuilderOptions<RouteConfig>>(options: Options) {
		return this.route("action", "internal", options);
	}

	public withMiddleware<
		ArgsValidator extends PropertyValidators | void,
		InputModule extends HaywireGenericModule,
		ModifiedModule extends HaywireGenericModule,
		ModifiedFactory extends HaywireGenericContainerFactory,
		Config extends Record<string, any> = object
	>(
		middleware: Middleware<
			DataModel,
			ArgsValidator,
			InputModule,
			ModifiedModule,
			ModifiedFactory,
			Config
		>
	) {
		return new ConvexRouter<
			DataModel,
			ModifiedModule,
			RouteConfig & (Config extends EmptyObject ? {} : Config),
			MiddlewareArgs & (ArgsValidator extends PropertyValidators ? ArgsValidator : {})
		>(this[unsafeRouterModule] as unknown as ModifiedModule, [
			...this[unsafeMiddlewarePipeline],
			middleware
		]);
	}

	public createMiddleware<Options extends MiddlewareBuilderOptions>(options: Options) {
		return new MiddlewareBuilder<DataModel, Options, Module>(options);
	}

	private route<
		Type extends FunctionType,
		Visibility extends FunctionVisibility,
		Options extends RouteBuilderOptions<any>
	>(functionType: Type, visibility: Visibility, options: Options) {
		return new RouteBuilder<
			DataModel,
			ConvexRouter<DataModel, Module, RouteConfig, MiddlewareArgs>,
			Type,
			Visibility,
			Options
		>(this, functionType, visibility, options);
	}
}

export function convexRouter<
	DataModel extends GenericDataModel,
	Module extends HaywireGenericModule
>(module: Module) {
	return ConvexRouter.fromModule<DataModel, Module>(module);
}
