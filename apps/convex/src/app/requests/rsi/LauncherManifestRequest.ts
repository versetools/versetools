import type {
	HttpRequestContract,
	HttpRequestInterface
} from "@versetools/core/requests/HttpRequestInterface";

export default class LauncherManifestRequest implements HttpRequestInterface {
	public readonly name = "LAUNCHER_MANIFEST";

	declare readonly decodedType: {
		version: string;
		releaseDate: string;
	};

	buildRequest(): HttpRequestContract {
		return {
			path: "https://install.robertsspaceindustries.com/rel/2/latest.yml",
			method: "GET"
		};
	}
}
