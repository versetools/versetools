import { config } from "$lib/config";

type CookieConfig = {
	cookie: string;
	ttl: number;
	sameSite?: boolean | "lax" | "strict" | "none";
};

type ServerConfig = {
	allowedFormRoutes: string[];
	sessions: CookieConfig;
};

export const serverConfig: ServerConfig = {
	allowedFormRoutes: ["/api/upload"],
	sessions: {
		cookie: config.cookies.session,
		ttl: 14 * 24 * 60 * 60,
		sameSite: "lax"
	}
};
