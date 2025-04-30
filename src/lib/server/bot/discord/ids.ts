export enum ButtonCustomId {
	OpenModTicket = "open-mod-ticket",
	OpenModTicketModal = "open-mod-ticket-modal",
	CloseModTicket = "close-mod-ticket",
	CloseModTicketWithReason = "close-mod-ticket-with-reason",
	CloseModTicketModal = "close-mod-ticket-modal",
	ReopenModTicket = "reopen-mod-ticket"
}

export enum OpenModTicketInputCustomId {
	IssueDescription = "issue-description"
}

export enum CloseModTicketInputCustomId {
	Reason = "reason"
}

export const ChannelIds = {
	moderationTickets: "1365632330672246824"
};

export const RoleIds = {
	developer: "1364653306915590245",
	moderator: "1365629599865770055"
};
