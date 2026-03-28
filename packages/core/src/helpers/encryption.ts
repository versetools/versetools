import { Base64 } from "convex/values";

const algorithm = "AES-GCM";
const ivLength = 12;

async function encryptionKey(encodedKey: string) {
	const keyBuffer = Base64.toByteArray(encodedKey) as BufferSource;

	return await crypto.subtle.importKey("raw", keyBuffer, algorithm, false, ["encrypt", "decrypt"]);
}

export async function generateEncryptionKey() {
	const key = await crypto.subtle.generateKey(
		{
			name: algorithm,
			length: 256
		},
		true,
		["encrypt", "decrypt"]
	);

	const keyBuffer = await crypto.subtle.exportKey("raw", key);
	return Base64.fromByteArray(new Uint8Array(keyBuffer));
}

export async function encrypt(data: string) {
	if (!process.env.CONVEX_ENCRYPTION_KEY) {
		throw new Error("CONVEX_ENCRYPTION_KEY is not set");
	}

	const key = await encryptionKey(process.env.CONVEX_ENCRYPTION_KEY);
	const iv = crypto.getRandomValues(new Uint8Array(ivLength));

	const encodedData = new TextEncoder().encode(data);
	const encryptedDataBuffer = await crypto.subtle.encrypt(
		{
			name: algorithm,
			iv
		},
		key,
		encodedData
	);

	const encryptedData = Base64.fromByteArray(new Uint8Array(encryptedDataBuffer));
	return Base64.fromByteArray(
		new TextEncoder().encode(`${Base64.fromByteArray(iv)}:${encryptedData}`)
	);
}

export async function decrypt(encryptedDataString: string) {
	if (!process.env.CONVEX_ENCRYPTION_KEY) {
		throw new Error("CONVEX_ENCRYPTION_KEY is not set");
	}

	const [encodedIv, ...splitEncryptedData] = new TextDecoder()
		.decode(Base64.toByteArray(encryptedDataString))
		.split(":");

	const iv = Base64.toByteArray(encodedIv) as BufferSource;
	const encryptedDataBuffer = Base64.toByteArray(splitEncryptedData.join(":")) as BufferSource;

	const key = await encryptionKey(process.env.CONVEX_ENCRYPTION_KEY);
	const dataBuffer = await crypto.subtle.decrypt(
		{
			name: algorithm,
			iv
		},
		key,
		encryptedDataBuffer
	);

	return new TextDecoder().decode(dataBuffer);
}
