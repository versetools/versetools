import { config } from "$lib/config";

type CookieConfig = {
	cookie: string;
	ttl: number;
	sameSite?: boolean | "lax" | "strict" | "none";
};

type ServerConfig = {
	allowedFormRoutes: string[];
	sessions: CookieConfig;
	consent: CookieConfig;
};

export const serverConfig: ServerConfig = {
	allowedFormRoutes: ["/upload"],
	sessions: {
		cookie: config.cookies.session,
		ttl: 14 * 24 * 60 * 60,
		sameSite: "lax"
	},
	consent: {
		cookie: config.cookies.consent,
		ttl: 365 * 24 * 60 * 60,
		sameSite: "strict"
	}
};
