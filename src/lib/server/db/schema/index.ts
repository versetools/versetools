import { adminUserTables } from "./admin-users.schema";
import { botTicketTables } from "./bot-tickets.schema";
import { dataRequestTables } from "./data-requests.schema";
import { ticketTables } from "./tickets.schema";

export const tables = {
	...adminUserTables,
	...dataRequestTables,
	...ticketTables,
	...botTicketTables
};

export * from "./admin-users.schema";
export * from "./data-requests.schema";
export * from "./tickets.schema";
export * from "./bot-tickets.schema";
