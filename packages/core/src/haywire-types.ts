import type {
	ClassToConstructable,
	Factory,
	GenericHaywireId,
	HaywireIdType,
	IsClass
} from "haywire";

export type GenericHaywireFactory = Factory<any, any, any, any>;

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
