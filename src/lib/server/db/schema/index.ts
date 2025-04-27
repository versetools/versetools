import { adminUserTables } from "./admin-users.schema";
import { dataRequestTables } from "./data-requests.schema";

export const tables = {
	...adminUserTables,
	...dataRequestTables
};

export * from "./admin-users.schema";
export * from "./data-requests.schema";
