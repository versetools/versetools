import type {
	ClassToConstructable,
	CombineListOutputs,
	ContainerFactory,
	createModule,
	GenericBinding,
	GenericHaywireId,
	HaywireIdType,
	IsClass,
	Module
} from "haywire";

export type HaywireGenericModule = Module<any, any, any, any>;
export type HaywireGenericContainerFactory = ContainerFactory<any, any, any, any>;

export type HaywireCombineModules<
	A extends Module<any, any, any, any>,
	B extends Module<any, any, any, any>
> =
	A extends Module<infer AOutputs, infer AListOutputs, infer ADependencies, infer AAsync>
		? B extends Module<infer BOutputs, infer BListOutputs, infer BDependencies, infer BAsync>
			? Module<
					AOutputs | BOutputs,
					CombineListOutputs<AListOutputs, BListOutputs>,
					ADependencies | BDependencies,
					AAsync extends true ? true : BAsync extends true ? true : AAsync
				>
			: never
		: never;

export type HaywireAddBindingsToModule<
	T extends Module<any, any, any, any>,
	Bindings extends [...GenericBinding[]]
> = Bindings extends [infer B extends GenericBinding]
	? HaywireCombineModules<T, ReturnType<typeof createModule<B>>>
	: Bindings extends [infer F extends GenericBinding, ...infer R extends GenericBinding[]]
		? HaywireAddBindingsToModule<HaywireCombineModules<T, ReturnType<typeof createModule<F>>>, R>
		: never;

export type HaywireModuleFromBindings<Bindings extends [...GenericBinding[]]> = Bindings extends [
	infer B extends GenericBinding
]
	? ReturnType<typeof createModule<B>>
	: Bindings extends [infer F extends GenericBinding, ...infer R extends GenericBinding[]]
		? HaywireAddBindingsToModule<ReturnType<typeof createModule<F>>, R>
		: never;

export type HaywireModuleToContainerFactory<T extends HaywireGenericModule> = ReturnType<
	T["toContainerFactory"]
>;

export type IdOrClassToHaywireIds<Dependencies extends readonly (GenericHaywireId | IsClass)[]> = {
	[Index in keyof Dependencies]: Dependencies[Index] extends IsClass
		? ClassToConstructable<Dependencies[Index]>
		: Dependencies[Index] extends GenericHaywireId
			? Dependencies[Index]
			: never;
};

export type HaywireDependencyIdTypes<Dependencies extends readonly [...GenericHaywireId[]]> = {
	[Index in keyof Dependencies]: HaywireIdType<Dependencies[Index]>;
};
