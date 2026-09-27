import { identifier } from "haywire";

import type { FileStorageAdapterInterface } from "../../services/files/adapters/FileStorageAdapterInterface";

export const uploadthingApiKeyId = identifier<string>().named("uploadthingApiKey");
export const uploadthingAppIdId = identifier<string>().named("uploadthingAppId");

export const fileStorageAdapterId = identifier<FileStorageAdapterInterface>();
