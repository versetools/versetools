import { bind, createModule, singletonScope } from "haywire";

import RSILauncherAuthenticationService from "../services/RSILauncherAuthenticationService";

export const rsiLauncherAuthenticationServiceBinding = bind(RSILauncherAuthenticationService)
	.withFactory(() => new RSILauncherAuthenticationService())
	.scoped(singletonScope);

export const rsiModule = createModule(rsiLauncherAuthenticationServiceBinding);
