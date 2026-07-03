import { bind, singletonScope } from "haywire";

import UploadthingFileStorageAdapter from "../../services/files/adapters/UploadthingFileStorageAdapter";
import FileStorageService from "../../services/files/FileStorageService";
import { fileStorageAdapterId, uploadthingApiKeyId } from "../ids/files";

export const uploadthingFileStorageAdapterBinding = bind(fileStorageAdapterId)
	.withDependencies([uploadthingApiKeyId])
	.withProvider((apiKey) => new UploadthingFileStorageAdapter(apiKey));

export const fileStorageServiceBinding = bind(FileStorageService)
	.withDependencies([fileStorageAdapterId])
	.withProvider((adapter) => new FileStorageService(adapter))
	.scoped(singletonScope);
