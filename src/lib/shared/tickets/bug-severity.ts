export enum BugSeverity {
	Low = "low",
	Medium = "medium",
	High = "high"
}

export const BugSeverityNames = {
	low: "Low",
	medium: "Medium",
	high: "High"
} satisfies Record<BugSeverity, string>;

export const BugSeverityOptions = (Object.keys(BugSeverityNames) as BugSeverity[]).map((key) => ({
	name: BugSeverityNames[key],
	value: key
}));
