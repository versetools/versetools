import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";

import { serverConfig } from "./config";

const CONSENT_VERSION = "1";

export type Consent = z.infer<typeof ConsentSchema> | null;

export const ConsentSchema = z.object({
	analytics: z.boolean()
});

export function getConsent(event: RequestEvent) {
	const cookie = event.cookies.get(serverConfig.consent.cookie);
	if (!cookie) return null;

	const [consentBase64, version] = cookie.split("~");
	if (version !== CONSENT_VERSION) return null;

	try {
		const data = JSON.parse(Buffer.from(consentBase64, "base64").toString());
		return ConsentSchema.parse(data);
	} catch {
		return null;
	}
}

export function setConsent(event: RequestEvent, choice: "accept" | "reject") {
	const consent = {
		analytics: choice === "accept"
	};

	const cookieValue = `${Buffer.from(JSON.stringify(consent)).toString("base64")}~${CONSENT_VERSION}`;

	event.cookies.set(serverConfig.consent.cookie, cookieValue, {
		httpOnly: true,
		secure: event.url.protocol === "https:",
		path: "/",
		maxAge: serverConfig.consent.ttl,
		sameSite: serverConfig.consent.sameSite ?? "strict"
	});

	return consent;
}
