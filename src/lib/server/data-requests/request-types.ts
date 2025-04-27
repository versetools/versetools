export enum DataRequestType {
	Export = "export",
	Delete = "delete",
	Restrict = "restrict",
	Update = "update"
}

export enum DataRequestStatus {
	AwaitingVerification = "awaiting_verification",
	Pending = "pending",
	Processing = "processing",
	Completed = "completed",
	Denied = "denied"
}

export enum DataRequestPartyType {
	Subject = "subject",
	ThirdParty = "third-party"
}
