import { UTApi } from "uploadthing/server";

import { building } from "$app/environment";
import { env } from "$env/dynamic/private";

const UPLOADTHING_APP_ID = building ? process.env.UPLOADTHING_APP_ID : env.UPLOADTHING_APP_ID;
const UPLOADTHING_TOKEN = building ? process.env.UPLOADTHING_TOKEN : env.UPLOADTHING_TOKEN;

export const uploadapi = new UTApi({
	defaultKeyType: "fileKey",
	token: UPLOADTHING_TOKEN
});

export function getFileUrl(key: string) {
	return `https://${UPLOADTHING_APP_ID}.ufs.sh/f/${key}`;
}
