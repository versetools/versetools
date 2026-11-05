import { identifier, type Container } from "haywire";

export const containerSupplierId = identifier<() => Container<any>>().named(
	"haywireContainerSupplier"
);
