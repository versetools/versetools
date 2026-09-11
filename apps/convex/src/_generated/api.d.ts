/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as app_commands_files_CreateFileMutation from "../app/commands/files/CreateFileMutation.js";
import type * as app_commands_files_CreateTemporaryFileMutation from "../app/commands/files/CreateTemporaryFileMutation.js";
import type * as app_commands_files_DeleteEntryFileMutation from "../app/commands/files/DeleteEntryFileMutation.js";
import type * as app_commands_files_DeleteFileMutation from "../app/commands/files/DeleteFileMutation.js";
import type * as app_commands_files_MakeFilePermanentMutation from "../app/commands/files/MakeFilePermanentMutation.js";
import type * as app_commands_files_TagFilesForDeletionMutation from "../app/commands/files/TagFilesForDeletionMutation.js";
import type * as app_commands_locations_CreateLocationMutation from "../app/commands/locations/CreateLocationMutation.js";
import type * as app_commands_locations_DeleteLocationMutation from "../app/commands/locations/DeleteLocationMutation.js";
import type * as app_commands_locations_LocationAncestorsQuery from "../app/commands/locations/LocationAncestorsQuery.js";
import type * as app_commands_locations_LocationDecendantsQuery from "../app/commands/locations/LocationDecendantsQuery.js";
import type * as app_commands_locations_LocationInverseSubtreeQuery from "../app/commands/locations/LocationInverseSubtreeQuery.js";
import type * as app_commands_locations_LocationSubtreeQuery from "../app/commands/locations/LocationSubtreeQuery.js";
import type * as app_commands_locations_LocationTreeQuery from "../app/commands/locations/LocationTreeQuery.js";
import type * as app_commands_locations_MoveLocationMutation from "../app/commands/locations/MoveLocationMutation.js";
import type * as app_commands_locations_RootLocationsQuery from "../app/commands/locations/RootLocationsQuery.js";
import type * as app_commands_locations_UpdateLocationDataMutation from "../app/commands/locations/UpdateLocationDataMutation.js";
import type * as app_config_aws from "../app/config/aws.js";
import type * as app_config_env from "../app/config/env.js";
import type * as app_config_subscriptions from "../app/config/subscriptions.js";
import type * as app_dataModel from "../app/dataModel.js";
import type * as app_main from "../app/main.js";
import type * as app_middleware_secretKeyMiddleware from "../app/middleware/secretKeyMiddleware.js";
import type * as app_schema_cache_actionCache from "../app/schema/cache/actionCache.js";
import type * as app_schema_files_files from "../app/schema/files/files.js";
import type * as app_schema_index from "../app/schema/index.js";
import type * as app_schema_locations from "../app/schema/locations.js";
import type * as app_services_cache_ActionCache from "../app/services/cache/ActionCache.js";
import type * as app_utils_Slugifier from "../app/utils/Slugifier.js";
import type * as components_posthog from "../components/posthog.js";
import type * as components_rateLimiter from "../components/rateLimiter.js";
import type * as crons from "../crons.js";
import type * as files_storage from "../files/storage.js";
import type * as files_workflow_deleteFiles from "../files/workflow/deleteFiles.js";
import type * as http from "../http.js";
import type * as locations from "../locations.js";
import type * as server_cache_actions from "../server/cache/actions.js";
import type * as server_fileStorage from "../server/fileStorage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "app/commands/files/CreateFileMutation": typeof app_commands_files_CreateFileMutation;
  "app/commands/files/CreateTemporaryFileMutation": typeof app_commands_files_CreateTemporaryFileMutation;
  "app/commands/files/DeleteEntryFileMutation": typeof app_commands_files_DeleteEntryFileMutation;
  "app/commands/files/DeleteFileMutation": typeof app_commands_files_DeleteFileMutation;
  "app/commands/files/MakeFilePermanentMutation": typeof app_commands_files_MakeFilePermanentMutation;
  "app/commands/files/TagFilesForDeletionMutation": typeof app_commands_files_TagFilesForDeletionMutation;
  "app/commands/locations/CreateLocationMutation": typeof app_commands_locations_CreateLocationMutation;
  "app/commands/locations/DeleteLocationMutation": typeof app_commands_locations_DeleteLocationMutation;
  "app/commands/locations/LocationAncestorsQuery": typeof app_commands_locations_LocationAncestorsQuery;
  "app/commands/locations/LocationDecendantsQuery": typeof app_commands_locations_LocationDecendantsQuery;
  "app/commands/locations/LocationInverseSubtreeQuery": typeof app_commands_locations_LocationInverseSubtreeQuery;
  "app/commands/locations/LocationSubtreeQuery": typeof app_commands_locations_LocationSubtreeQuery;
  "app/commands/locations/LocationTreeQuery": typeof app_commands_locations_LocationTreeQuery;
  "app/commands/locations/MoveLocationMutation": typeof app_commands_locations_MoveLocationMutation;
  "app/commands/locations/RootLocationsQuery": typeof app_commands_locations_RootLocationsQuery;
  "app/commands/locations/UpdateLocationDataMutation": typeof app_commands_locations_UpdateLocationDataMutation;
  "app/config/aws": typeof app_config_aws;
  "app/config/env": typeof app_config_env;
  "app/config/subscriptions": typeof app_config_subscriptions;
  "app/dataModel": typeof app_dataModel;
  "app/main": typeof app_main;
  "app/middleware/secretKeyMiddleware": typeof app_middleware_secretKeyMiddleware;
  "app/schema/cache/actionCache": typeof app_schema_cache_actionCache;
  "app/schema/files/files": typeof app_schema_files_files;
  "app/schema/index": typeof app_schema_index;
  "app/schema/locations": typeof app_schema_locations;
  "app/services/cache/ActionCache": typeof app_services_cache_ActionCache;
  "app/utils/Slugifier": typeof app_utils_Slugifier;
  "components/posthog": typeof components_posthog;
  "components/rateLimiter": typeof components_rateLimiter;
  crons: typeof crons;
  "files/storage": typeof files_storage;
  "files/workflow/deleteFiles": typeof files_workflow_deleteFiles;
  http: typeof http;
  locations: typeof locations;
  "server/cache/actions": typeof server_cache_actions;
  "server/fileStorage": typeof server_fileStorage;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  posthog: import("@posthog/convex/_generated/component.js").ComponentApi<"posthog">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
};
