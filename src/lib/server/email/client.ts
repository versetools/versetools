import { SESv2Client } from "@aws-sdk/client-sesv2";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";

const ACCESS_KEY = building ? process.env.AWS_ACCESS_KEY : env.AWS_ACCESS_KEY;
const SECRET_ACCESS_KEY = building ? process.env.AWS_SECRET_ACCESS_KEY : env.AWS_SECRET_ACCESS_KEY;

export const client = new SESv2Client({
	region: "eu-central-1",
	credentials: {
		accessKeyId: ACCESS_KEY!,
		secretAccessKey: SECRET_ACCESS_KEY!
	}
});
