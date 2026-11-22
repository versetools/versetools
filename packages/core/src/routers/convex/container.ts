import type { Binding, Container, GenericHaywireId, OutputHaywireId } from "haywire";

import { genericArgsId, genericCtxId } from "./ids";
import { containerSupplierId } from "../../config/bindings/haywire";
import { ServerConfigurationError } from "../../errors";
import type {
	HaywireAddBindingsToModule,
	HaywireGenericContainerFactory,
	HaywireGenericModule,
	HaywireModuleToContainer
} from "../../haywire-types";
import type { GenericCtx } from "../../helpers";
import type { RequestCustomMetadata } from "../types";

const unsafeCurrentContainerSymbol = Symbol("unsafeCurrentContainerSymbol");

export function resolveDependencies(
	container: Container<any>,
	dependencyIds: readonly GenericHaywireId[]
) {
	return Promise.all(
		dependencyIds.map(async (id) => {
			try {
				return await container.getAsync(id);
			} catch (e) {
				throw new ServerConfigurationError({
					message: `Failed to resolve route dependency with id: ${id.toString()}`,
					cause: `${e}`
				});
			}
		})
	);
}

export type BuiltContainerFromModule<T extends HaywireGenericModule> = HaywireModuleToContainer<
	HaywireAddBindingsToModule<
		T,
		[
			Binding<OutputHaywireId<typeof genericCtxId>, [], false>,
			Binding<OutputHaywireId<typeof genericArgsId>, [], false>,
			Binding<OutputHaywireId<typeof containerSupplierId>, [], false>
		]
	>
>;

export function buildContainer(
	containerFactory: HaywireGenericContainerFactory,
	instances: {
		ctx: GenericCtx<any> & {
			customMetadata: RequestCustomMetadata;
			[unsafeCurrentContainerSymbol]?: Container<any>;
		};
		args: object;
	}
) {
	const ctx = instances.ctx;

	let container: Container<any>;
	try {
		container = containerFactory
			.bindInstance(genericCtxId, ctx)
			.bindInstance(genericArgsId, instances.args)
			.bindInstance(containerSupplierId, () => container)
			.toContainer();
	} catch (e) {
		throw new ServerConfigurationError({
			message: "Failed to create Haywire container",
			cause: `${e}`
		});
	}

	if (ctx[unsafeCurrentContainerSymbol]) {
		throw new ServerConfigurationError({
			message: "A container has already been created for this context"
		});
	}

	ctx[unsafeCurrentContainerSymbol] = container;

	return container;
}

export function acquireContainer(
	containerFactory: HaywireGenericContainerFactory,
	ctx: GenericCtx<any> & {
		customMetadata: RequestCustomMetadata;
		[unsafeCurrentContainerSymbol]?: Container<any>;
	}
) {
	const container = ctx[unsafeCurrentContainerSymbol];
	if (container) return container;

	return buildContainer(containerFactory, {
		ctx,
		args: {}
	});
}
