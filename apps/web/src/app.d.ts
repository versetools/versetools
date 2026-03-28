///<reference types="@hcaptcha/types"/>


declare global {
	interface Window {
		consent: {
			dismiss: () => void;
		};
	}

	namespace App {
		interface Locals {
		}

		interface Error {
			type?: string;
			zodError?: any;
		}

		// interface PageState {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
