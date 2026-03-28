import { Email } from "../email";

export const email = new Email({
	region: "eu-central-1",
	accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
});
