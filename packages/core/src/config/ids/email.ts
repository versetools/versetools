import { identifier } from "haywire";

import type { EmailSenderAdapterInterface } from "../../services/email/adapters/EmailSenderAdapterInterface";

export const emailSenderAdapterId = identifier<EmailSenderAdapterInterface>();
