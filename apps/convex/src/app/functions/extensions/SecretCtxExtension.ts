import { ResultError } from "@versetools/core/errors";

import { CtxExtension } from "./CtxExtension";

export class SecretCtxExtension<T> extends CtxExtension<T> {
	constructor(
		private secret: string | undefined,
		private readonly required = true
	) {
		super();
	}

	public get(): { validSecret: boolean } {
		const valid = this.secret === process.env.CONVEX_SECRET && !!process.env.CONVEX_SECRET;
		if (this.required && !valid) {
			throw new ResultError("INVALID_SECRET", {
				message: "Invalid secret"
			});
		}

		return {
			validSecret: valid
		};
	}
}
