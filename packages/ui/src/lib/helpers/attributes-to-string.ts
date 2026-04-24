export function attributesToString(attributes: Record<string, string | boolean | undefined>) {
	const passedAttributes = Object.fromEntries(
		Object.entries(attributes).filter(([_, value]) => value !== undefined)
	) as Record<string, string | boolean>;

	const keys = Object.keys(passedAttributes);
	if (keys.length === 0) {
		return "";
	}

	return (
		" " +
		keys
			.map((key) => {
				const value = passedAttributes[key];
				if (typeof value === "boolean") {
					return value ? key : null;
				}
				return `${key}="${value}"`;
			})
			.filter((attribute) => attribute !== null)
			.join(" ")
	);
}
