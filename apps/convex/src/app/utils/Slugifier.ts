export class Slugifier {
	static slugify(value: string) {
		return value
			.replaceAll(/[[\](),.'"@#~]/g, "")
			.replaceAll(" ", "-")
			.replaceAll(/-+/g, "-")
			.replaceAll(/_+/g, "_")
			.toLowerCase();
	}
}
