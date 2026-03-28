import type { DataModel } from "$convex/_generated/dataModel";
import { err, ok, Result } from "@l3dev/result";
import { APIBase } from "@versetools/core/apis";
import * as YAML from "yaml";

export type RSIRequestParams = {
	url: string;
	method?: "GET" | "POST";
	body?: object;
	headers?: HeadersInit;
	credentials?: {
		deviceId?: string;
		token?: string;
	};
};

type RSILauncherManifest = {
	version: string;
	releaseDate: string;
};

type LoginParams = {
	username: string;
	password: string;
	launcherVersion: string;
	deviceId?: string;
};

type LoginResponse = {
	success: boolean;
	code: string & {};
	msg: string;
	data: {
		session_name: string;
		session_id: string;
	};
} & (
	| {
			code: "ErrCaptchaRequiredLauncher";
	  }
	| {
			code: "ErrMultiStepRequired";
			data: {
				prompt: string;
				new_device: boolean;
				device_id: string;
				device_header: string;
				device_type: string;
				device_name: string;
				duration: string;
			};
	  }
	| {
			code: "OK";
			data: {
				account_id: string;
				citizen_id: string;
				nickname: string;
				displayname: string;
			};
	  }
);

type MultiStepLoginParams = {
	code: string;
	deviceId: string;
};

export class RSIAPI extends APIBase<DataModel> {
	async getLauncherManifest() {
		const url = "https://install.robertsspaceindustries.com/rel/2/latest.yml";
		const fetchResult = await this.safeFetch("RSI_LAUNCHER_MANIFEST", url, {
			method: "GET"
		});

		if (!fetchResult.ok) {
			return fetchResult;
		}

		const response = fetchResult.value;
		if (!response.ok) {
			return err("BAD_RESPONSE", { response: await this.serializeResponse(response) });
		}

		const readResult = await Result.fromPromise(response.text(), {
			onError: { type: "RSI_LAUNCHER_MANIFEST_READ" }
		});
		if (!readResult.ok) {
			return readResult;
		}

		return Result.from(() => YAML.parse(readResult.value) as RSILauncherManifest, {
			onError: { type: "RSI_LAUNCHER_MANIFEST_PARSE" }
		});
	}

	async login(params: LoginParams) {
		const loginResult = await this.requestSignin(params);
		if (!loginResult.ok) {
			return loginResult;
		}

		const loginResponse = loginResult.value;
		if (loginResponse.code === "OK") {
			return ok(loginResponse.data);
		}

		if (loginResponse.code !== "ErrMultiStepRequired") {
			return err("RSI_LOGIN_UNHANDLED_RESPONSE", { response: loginResponse });
		}

		return err("RSI_MULTI_STEP_REQUIRED", { response: loginResponse });
	}

	async completeMultiStepLogin(params: MultiStepLoginParams) {
		// TODO: implement
	}

	protected async requestSignin({ username, password, launcherVersion, deviceId }: LoginParams) {
		const requestResult = await this.request("RSI_LOGIN", {
			url: "https://robertsspaceindustries.com/api/launcher/v3/signin",
			method: "POST",
			body: {
				username,
				password,
				remember: true,
				launcherVersion
			},
			credentials: {
				deviceId
			}
		});

		if (!requestResult.ok) {
			return requestResult;
		}

		const parseResult = await Result.fromPromise(requestResult.value.json(), {
			onError: { type: "RSI_SIGNIN_PARSE" }
		});
		if (!parseResult.ok) {
			return parseResult;
		}

		return ok(parseResult.value as LoginResponse);
	}

	protected async request<const TType extends string>(
		errorType: TType,
		{ url, method, body, headers, credentials }: RSIRequestParams
	) {
		headers = new Headers(headers);

		if (body) {
			headers.set("Content-Type", "application/json");
		}
		if (credentials?.deviceId) {
			headers.set("X-Device-Id", credentials.deviceId);
		}
		if (credentials?.token) {
			headers.set("X-Rsi-Token", credentials.token);
		}

		const result = await this.safeFetch(errorType, url, {
			method: method,
			body: body ? JSON.stringify(body) : undefined,
			headers
		});

		if (!result.ok) {
			return result;
		}

		const response = result.value;
		if (!response.ok) {
			return err("RSI_BAD_RESPONSE", { response: await this.serializeResponse(response) });
		}

		return result;
	}
}
