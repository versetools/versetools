import { SESv2Client } from "@aws-sdk/client-sesv2";
import { bind, identifier } from "haywire";

import { env } from "$convex/_generated/server";

export const sesClientId = identifier<SESv2Client>();

export const sesClientBinding = bind(sesClientId).withGenerator(
	() =>
		new SESv2Client({
			region: "eu-central-1",
			credentials: {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY
			}
		})
);
