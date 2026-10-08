import { createModule } from "haywire";

import {
	noopSubscriptionRegistryBinding,
	runnerServiceBinding,
	subscriptionRegistryBinding
} from "./bindings/commands";
import {
	emailServiceBinding,
	noOpEmailSenderAdapterBinding,
	sesEmailSenderAdapterBinding
} from "./bindings/email";
import { fileStorageServiceBinding, uploadthingFileStorageAdapterBinding } from "./bindings/files";

export type CoreModuleConfig = {
	email: {
		providers: {
			send: "ses" | "noop";
			receive: "sqs";
		};
	};
	fileStorage: "uploadthing";
	runner?: {
		subscriptions: boolean;
	};
};

export function createCoreModule(config: CoreModuleConfig) {
	return createModule(runnerServiceBinding)
		.addBinding(
			(config.runner?.subscriptions ?? true)
				? subscriptionRegistryBinding
				: noopSubscriptionRegistryBinding
		)
		.addBinding(emailServiceBinding)
		.addBinding(
			config.email.providers.send === "ses"
				? sesEmailSenderAdapterBinding
				: noOpEmailSenderAdapterBinding
		)
		.addBinding(fileStorageServiceBinding)
		.addBinding(
			config.fileStorage === "uploadthing"
				? uploadthingFileStorageAdapterBinding
				: uploadthingFileStorageAdapterBinding
		);
}
