import { adminUserTables } from "./admin-users.schema";
import { dataRequestTables } from "./data-requests.schema";
import { modTicketTables } from "./tickets.schema";

export const tables = {
	...adminUserTables,
	...dataRequestTables,
	...modTicketTables
};

export * from "./admin-users.schema";
export * from "./data-requests.schema";
export * from "./tickets.schema";
