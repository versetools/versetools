import { SESv2Client } from "@aws-sdk/client-sesv2";
import { bind } from "haywire";

import { env } from "$convex/_generated/server";
import { sesClientId } from "@versetools/core/config/ids/aws";

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
