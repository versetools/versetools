import { bind, singletonScope } from "haywire";

import RSILauncherAuthenticationService from "../services/RSILauncherAuthenticationService";

export const rsiLauncherAuthenticationServiceBinding = bind(RSILauncherAuthenticationService)
	.withGenerator(() => new RSILauncherAuthenticationService())
	.scoped(singletonScope);
