import { type GenericDataModel } from "convex/server";
import { type GenericHaywireId, type IsClass } from "haywire";

import type {
	MiddlewareBindInstances,
	MiddlewareBuilderOptions,
	Middleware,
	DefaultMiddlewareHandler,
	MiddlewareAddBindings,
	ArgsFromConvexValidator,
	ArgsToArgsArray,
	MiddlewareCtx
} from "./types";
import type {
	HaywireDependencyIdTypes,
	HaywireGenericContainerFactory,
	HaywireGenericModule,
	HaywireModuleToContainerFactory,
	IdOrClassToHaywireIds
} from "../../haywire-types";
import type { MaybePromise } from "../../utility-types";

export type { MiddlewareBuilderOptions } from "./types";

export class MiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputModule extends HaywireGenericModule,
	Config extends Record<string, any> = Record<string, any>
> {
	constructor(private readonly options: Options) {}

	setConfig<Config extends Record<string, any>>() {
		return new MiddlewareBuilder<DataModel, Options, InputModule, Config>(this.options);
	}

	withAddBindings<ModifiedModule extends HaywireGenericModule>(
		fn: MiddlewareAddBindings<DataModel, Options["args"], InputModule, ModifiedModule, Config>
	) {
		return new AddBindingsMiddlewareBuilder<
			DataModel,
			Options,
			InputModule,
			ModifiedModule,
			Config
		>(this.options, fn);
	}

	withBindInstances<ModifiedFactory extends HaywireGenericContainerFactory>(
		fn: MiddlewareBindInstances<
			DataModel,
			Options["args"],
			HaywireModuleToContainerFactory<InputModule>,
			ModifiedFactory,
			Config
		>
	) {
		return new BindInstancesMiddlewareBuilder<
			DataModel,
			Options,
			InputModule,
			InputModule,
			ModifiedFactory,
			Config
		>(this.options, fn);
	}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIds: [...Dependencies]
	) {
		return new DepsMiddlewareBuilder<
			DataModel,
			Options,
			IdOrClassToHaywireIds<Dependencies>,
			InputModule,
			InputModule,
			HaywireModuleToContainerFactory<InputModule>
		>(this.options, dependencyIds as IdOrClassToHaywireIds<Dependencies>);
	}

	withHandler(
		handler: DefaultMiddlewareHandler<DataModel, Options["args"], Config>
	): Middleware<
		DataModel,
		Options["args"],
		InputModule,
		InputModule,
		HaywireModuleToContainerFactory<InputModule>,
		Config
	> {
		return Object.freeze({
			args: this.options.args,
			handler
		});
	}
}

class AddBindingsMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputModule extends HaywireGenericModule,
	ModifiedModule extends HaywireGenericModule,
	Config extends Record<string, any> = Record<string, any>
> implements Middleware<
	DataModel,
	Options["args"],
	InputModule,
	ModifiedModule,
	HaywireModuleToContainerFactory<ModifiedModule>,
	Config
> {
	constructor(
		private readonly options: Options,
		readonly addBindings: MiddlewareAddBindings<
			DataModel,
			Options["args"],
			InputModule,
			ModifiedModule,
			Config
		>
	) {}

	get args(): Options["args"] {
		return this.options.args;
	}

	withBindInstances<ModifiedFactory extends HaywireGenericContainerFactory>(
		fn: MiddlewareBindInstances<
			DataModel,
			Options["args"],
			HaywireModuleToContainerFactory<ModifiedModule>,
			ModifiedFactory,
			Config
		>
	) {
		return new BindInstancesMiddlewareBuilder<
			DataModel,
			Options,
			InputModule,
			ModifiedModule,
			ModifiedFactory,
			Config
		>(this.options, fn, this.addBindings);
	}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIds: [...Dependencies]
	) {
		return new DepsMiddlewareBuilder<
			DataModel,
			Options,
			IdOrClassToHaywireIds<Dependencies>,
			InputModule,
			ModifiedModule,
			HaywireModuleToContainerFactory<ModifiedModule>,
			Config
		>(this.options, dependencyIds as IdOrClassToHaywireIds<Dependencies>, this.addBindings);
	}

	withHandler(
		handler: DefaultMiddlewareHandler<DataModel, Options["args"], Config>
	): Middleware<
		DataModel,
		Options["args"],
		InputModule,
		ModifiedModule,
		HaywireModuleToContainerFactory<ModifiedModule>,
		Config
	> {
		return Object.freeze({
			args: this.options.args,
			addBindings: this.addBindings,
			handler
		});
	}
}

class BindInstancesMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	InputModule extends HaywireGenericModule,
	ModifiedModule extends HaywireGenericModule,
	ModifiedFactory extends HaywireGenericContainerFactory,
	Config extends Record<string, any> = Record<string, any>
> implements Middleware<
	DataModel,
	Options["args"],
	InputModule,
	ModifiedModule,
	ModifiedFactory,
	Config
> {
	constructor(
		private readonly options: Options,
		readonly bindInstances: MiddlewareBindInstances<
			DataModel,
			Options["args"],
			HaywireModuleToContainerFactory<ModifiedModule>,
			ModifiedFactory,
			Config
		>,
		readonly addBindings?: MiddlewareAddBindings<
			DataModel,
			Options["args"],
			InputModule,
			ModifiedModule,
			Config
		>
	) {}

	get args(): Options["args"] {
		return this.options.args;
	}

	withDependencies<Dependencies extends readonly (GenericHaywireId | IsClass)[]>(
		dependencyIds: [...Dependencies]
	) {
		return new DepsMiddlewareBuilder<
			DataModel,
			Options,
			IdOrClassToHaywireIds<Dependencies>,
			InputModule,
			ModifiedModule,
			ModifiedFactory,
			Config
		>(
			this.options,
			dependencyIds as IdOrClassToHaywireIds<Dependencies>,
			this.addBindings,
			this.bindInstances
		);
	}

	withHandler(
		handler: DefaultMiddlewareHandler<DataModel, Options["args"], Config>
	): Middleware<DataModel, Options["args"], InputModule, ModifiedModule, ModifiedFactory, Config> {
		return Object.freeze({
			args: this.options.args,
			addBindings: this.addBindings,
			bindInstances: this.bindInstances,
			handler
		});
	}
}

class DepsMiddlewareBuilder<
	DataModel extends GenericDataModel,
	Options extends MiddlewareBuilderOptions,
	DependencyIds extends readonly [...GenericHaywireId[]],
	InputModule extends HaywireGenericModule,
	ModifiedModule extends HaywireGenericModule,
	ModifiedFactory extends HaywireGenericContainerFactory,
	Config extends Record<string, any> = Record<string, any>
> {
	constructor(
		private readonly options: Options,
		private readonly dependencyIds: DependencyIds,
		private readonly addBindings?: MiddlewareAddBindings<
			DataModel,
			Options["args"],
			InputModule,
			ModifiedModule,
			Config
		>,
		private readonly bindInstances?: MiddlewareBindInstances<
			DataModel,
			Options["args"],
			HaywireModuleToContainerFactory<ModifiedModule>,
			ModifiedFactory,
			Config
		>
	) {}

	withHandler(
		handler: (
			ctx: MiddlewareCtx<DataModel, Config>,
			...args: [
				...ArgsToArgsArray<ArgsFromConvexValidator<Options["args"]>>,
				...HaywireDependencyIdTypes<DependencyIds>
			]
		) => MaybePromise<void>
	): Middleware<DataModel, Options["args"], InputModule, ModifiedModule, ModifiedFactory, Config> {
		return Object.freeze({
			args: this.options.args,
			addBindings: this.addBindings,
			bindInstances: this.bindInstances,
			dependencyIds: this.dependencyIds,
			handler
		});
	}
}
