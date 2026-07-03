import { bind } from "haywire";

import NoOpEmailSenderAdapter from "../../services/email/adapters/NoOpEmailSenderAdapter";
import SESEmailSenderAdapter from "../../services/email/adapters/SESEmailSenderAdapter";
import EmailService from "../../services/email/EmailService";
import { sesClientId } from "../ids/aws";
import { emailSenderAdapterId } from "../ids/email";

export const noOpEmailSenderAdapterBinding = bind(emailSenderAdapterId).withGenerator(
	() => new NoOpEmailSenderAdapter()
);

export const sesEmailSenderAdapterBinding = bind(emailSenderAdapterId)
	.withDependencies([sesClientId])
	.withProvider((client) => new SESEmailSenderAdapter(client));

export const emailServiceBinding = bind(EmailService)
	.withDependencies([emailSenderAdapterId])
	.withProvider((sender) => new EmailService(sender));
