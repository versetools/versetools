import { ok } from "@l3dev/result";
import { ResultError } from "@versetools/core/errors";

import FetchClient from "$convex/app/requests/FetchClient";
import LauncherManifestRequest from "$convex/app/requests/rsi/LauncherManifestRequest";
import type { SigninRequestParams } from "$convex/app/requests/rsi/SigninRequest";
import SigninRequest from "$convex/app/requests/rsi/SigninRequest";

export default class RSILauncherAuthenticationService {
	private readonly rsi: FetchClient;

	constructor() {
		this.rsi = new FetchClient("https://robertsspaceindustries.com");
	}

	public async getLauncherManifest() {
		const request = new LauncherManifestRequest();

		const result = await this.rsi.fetchAndDecode(request);
		if (!result.ok) {
			throw ResultError.from(result);
		}

		return result.value.body;
	}

	public async signin(params: SigninRequestParams) {
		const request = new SigninRequest(params);

		const result = await this.rsi.fetchAndDecode(request);
		if (!result.ok) {
			throw ResultError.from(result);
		}

		const body = result.value.body;

		if (body.code === "OK") {
			return ok(body.data);
		}

		if (body.code !== "ErrMultiStepRequired") {
			throw new ResultError("RSI_SIGNIN_UNHANDLED_RESPONSE", { response: body });
		}

		// TODO: perform multi step signin
		throw new ResultError("RSI_MULTI_STEP_SIGNIN_REQUIRED", { response: body });
	}
}
