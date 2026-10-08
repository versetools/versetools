import type {
	ClassToConstructable,
	ContainerFactory,
	GenericHaywireId,
	HaywireIdType,
	IsClass,
	Module
} from "haywire";

export type HaywireGenericModule = Module<any, any, any, any>;
export type HaywireGenericContainerFactory = ContainerFactory<any, any, any, any>;

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
