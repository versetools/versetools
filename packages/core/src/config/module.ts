import { createModule } from "haywire";

import { runnerServiceBinding } from "./bindings/commands";
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
};

export function createCoreModule(config: CoreModuleConfig) {
	return createModule(runnerServiceBinding)
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
