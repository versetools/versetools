import { adminUserTables } from "./admin-users.schema";
import { dataRequestTables } from "./data-requests.schema";
import { modTicketTables } from "./mod-tickets.schema";

export const tables = {
	...adminUserTables,
	...dataRequestTables,
	...modTicketTables
};

export * from "./admin-users.schema";
export * from "./data-requests.schema";
export * from "./mod-tickets.schema";
