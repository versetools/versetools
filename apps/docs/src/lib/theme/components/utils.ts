import { resolve } from "$app/paths";

export function getPathFromBase(path: string) {
	if (path === "/") return resolve("/");

	if (!path.startsWith("/")) {
		const url = new URL(path, "http://base");
		return path.endsWith("/") ||
			path.split("/").pop()!.split(".").length > 1 ||
			url.hash ||
			url.search
			? path
			: path + "/";
	}
	return resolve(path as any);
}

export function parseImageSrc(src: string) {
	if (src.startsWith("//")) return src;
	return resolve(src as any);
}

export function isLinkActive(link: string, routeId: string) {
	// Normalize both by removing trailing slashes for comparison
	const normalizedLink = link?.replace(/\/$/, "") || "";
	const normalizedRouteId = routeId?.replace(/\/$/, "") || "";
	return normalizedLink === normalizedRouteId;
}
