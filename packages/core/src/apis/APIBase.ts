import { err, Result } from "@l3dev/result";
import type { GenericDataModel } from "convex/server";

import type { Runner } from "../commands";

export abstract class APIBase<DataModel extends GenericDataModel> {
	constructor(protected readonly runner: Runner<DataModel>) {}

	protected async safeFetch<const TType>(
		type: TType,
		input: string | URL | Request,
		init?: RequestInit
	) {
		const result = await Result.fromPromise(fetch(input, init), {
			onError: { type }
		});

		if (!result.ok) {
			return err(result.type, {
				error: { name: result.context.error.name, message: result.context.error.message }
			});
		}

		return result;
	}

	protected async serializeResponse(response: Response, body?: any) {
		return {
			url: response.url,
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			body: body ?? (response.body ? await response.text() : null)
		};
	}
}
