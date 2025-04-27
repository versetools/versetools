import type { Consent } from "$server/consent";
import type { DbAdminUser } from "./lib/server/db";

declare global {
	namespace App {
		interface Session {
			oauth?: {
				state: string;
				params?: OAuthLoginParams;
			} | null;
			oauth_error?: {
				error: string;
				error_description?: string | null;
			} | null;
		}

		interface Locals {
			consent: Consent;
			session: AppSession;
			adminUser?: DbAdminUser | null;
		}
		// interface Error {}

		interface PageData {
			authenticated?: boolean;
			currentUser?: Awaited<ReturnType<typeof transformers.user.private>> | null;
		}

		// interface PageState {}
		// interface Platform {}
	}

	declare module "*&imagetools" {
		const out;
		export default out;
	}
}

export {};
