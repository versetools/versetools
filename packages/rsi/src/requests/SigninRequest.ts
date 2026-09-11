import { RSIRequest, type RSIRequestContract } from "./RSIRequest";

export type SigninRequestParams = {
	username: string;
	password: string;
	launcherVersion: string;
	deviceId?: string;
};

export default class SigninRequest extends RSIRequest {
	public readonly name = "LAUNCHER_SIGNIN";

	declare readonly decodedType: {
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

	constructor(public readonly params: SigninRequestParams) {
		super();
	}

	buildRSIRequest(): RSIRequestContract {
		return {
			path: "/api/launcher/v3/signin",
			method: "POST",
			body: {
				username: this.params.username,
				password: this.params.password,
				remember: true,
				launcherVersion: this.params.launcherVersion
			},
			credentials: {
				deviceId: this.params.deviceId
			}
		};
	}
}
