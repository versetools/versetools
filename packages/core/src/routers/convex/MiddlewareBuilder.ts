import { type GenericDataModel } from "convex/server";
import { type GenericHaywireId, type IsClass } from "haywire";

import type {
	MiddlewareBinder,
	MiddlewareBuilderOptions,
	Middleware,
	DefaultMiddlewareHandler
} from "./types";
import type {
	HaywireDependencyIdTypes,
	HaywireGenericContainerFactory,
	IdOrClassToHaywireIds
} from "../../haywire-types";
import type { MaybePromise } from "../../utility-types";

export type { MiddlewareBuilderOptions } from "./types";

export class MiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputFactory extends HaywireGenericContainerFactory
> {
	constructor(private readonly options: Options) {}

	withBinder<
		OutputFactory extends HaywireGenericContainerFactory,
		BinderConfig extends Record<string, any> = Record<string, any>
	>(
		binder: MiddlewareBinder<DataModel, InputFactory, Options["args"], OutputFactory, BinderConfig>
	) {
		return new BinderMiddlewareBuilder(this.options, binder);
	}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIds: [...Dependencies]
	) {
		return new DepsMiddlewareBuilder<
			DataModel,
			Options,
			InputFactory,
			IdOrClassToHaywireIds<Dependencies>
		>(this.options, dependencyIds as IdOrClassToHaywireIds<Dependencies>);
	}

	withHandler<HandlerConfig extends Record<string, any> = Record<string, any>>(
		handler: DefaultMiddlewareHandler<DataModel, Options["args"], HandlerConfig>
	) {
		return new HandlerMiddlewareBuilder<DataModel, Options, InputFactory, HandlerConfig>(
			this.options,
			handler
		);
	}
}

class BinderMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputFactory extends HaywireGenericContainerFactory,
	OutputFactory extends HaywireGenericContainerFactory,
	BinderConfig extends Record<string, any> = Record<string, any>
> implements Middleware<
	DataModel,
	Options["args"],
	InputFactory,
	OutputFactory,
	BinderConfig,
	Record<string, any>
> {
	constructor(
		private readonly options: Options,
		readonly binder: MiddlewareBinder<
			DataModel,
			InputFactory,
			Options["args"],
			OutputFactory,
			BinderConfig
		>
	) {}

	get args(): Options["args"] {
		return this.options.args;
	}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIds: [...Dependencies]
	) {
		return new DepsBinderMiddlewareBuilder(
			this.options,
			this.binder,
			dependencyIds as IdOrClassToHaywireIds<Dependencies>
		);
	}

	withHandler<HandlerConfig extends Record<string, any> = Record<string, any>>(
		handler: DefaultMiddlewareHandler<DataModel, Options["args"], HandlerConfig>
	): Middleware<
		DataModel,
		Options["args"],
		InputFactory,
		OutputFactory,
		BinderConfig,
		HandlerConfig
	> {
		return Object.freeze({
			args: this.options.args,
			binder: this.binder,
			handler
		});
	}
}

class HandlerMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputFactory extends HaywireGenericContainerFactory,
	HandlerConfig extends Record<string, any> = Record<string, any>
> implements Middleware<
	DataModel,
	Options["args"],
	InputFactory,
	InputFactory,
	Record<string, any>,
	HandlerConfig
> {
	constructor(
		private readonly options: Options,
		readonly handler: (config: HandlerConfig, ...args: any) => MaybePromise<void>,
		readonly dependencyIds?: readonly GenericHaywireId[]
	) {}

	get args(): Options["args"] {
		return this.options.args;
	}

	withBinder<
		OutputFactory extends HaywireGenericContainerFactory,
		BinderConfig extends Record<string, any> = Record<string, any>
	>(
		binder: MiddlewareBinder<DataModel, InputFactory, Options["args"], OutputFactory, BinderConfig>
	): Middleware<
		DataModel,
		Options["args"],
		InputFactory,
		OutputFactory,
		BinderConfig,
		HandlerConfig
	> {
		return Object.freeze({
			args: this.options.args,
			dependencyIds: this.dependencyIds,
			binder,
			handler: this.handler
		});
	}
}

class DepsMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputFactory extends HaywireGenericContainerFactory,
	DependencyIds extends readonly [...GenericHaywireId[]]
> {
	constructor(
		private readonly options: Options,
		private readonly dependencyIds: DependencyIds
	) {}

	withHandler<HandlerConfig extends Record<string, any> = Record<string, any>>(
		handler: (
			config: HandlerConfig,
			...deps: HaywireDependencyIdTypes<DependencyIds>
		) => MaybePromise<void>
	) {
		return new HandlerMiddlewareBuilder<DataModel, Options, InputFactory, HandlerConfig>(
			this.options,
			handler,
			this.dependencyIds
		);
	}
}

class DepsBinderMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputFactory extends HaywireGenericContainerFactory,
	OutputFactory extends HaywireGenericContainerFactory,
	DependencyIds extends readonly [...GenericHaywireId[]],
	BinderConfig extends Record<string, any> = Record<string, any>
> {
	constructor(
		private readonly options: Options,
		private readonly binder: MiddlewareBinder<
			DataModel,
			InputFactory,
			Options["args"],
			OutputFactory,
			BinderConfig
		>,
		private readonly dependencyIds: DependencyIds
	) {}

	withHandler<HandlerConfig extends Record<string, any> = Record<string, any>>(
		handler: (
			config: HandlerConfig,
			...deps: HaywireDependencyIdTypes<DependencyIds>
		) => MaybePromise<void>
	): Middleware<
		DataModel,
		Options["args"],
		InputFactory,
		OutputFactory,
		BinderConfig,
		HandlerConfig
	> {
		return Object.freeze({
			args: this.options.args,
			dependencyIds: this.dependencyIds,
			binder: this.binder,
			handler: handler
		});
	}
}
