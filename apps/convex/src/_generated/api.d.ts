/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as app_apis_FileStorageAPI from "../app/apis/FileStorageAPI.js";
import type * as app_apis_PosthogAPI from "../app/apis/PosthogAPI.js";
import type * as app_apis_RSIAPI from "../app/apis/RSIAPI.js";
import type * as app_apis_index from "../app/apis/index.js";
import type * as app_cache_ActionCache from "../app/cache/ActionCache.js";
import type * as app_cache_index from "../app/cache/index.js";
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
import type * as app_commands_posthog_FeatureFlagQuery from "../app/commands/posthog/FeatureFlagQuery.js";
import type * as app_commands_posthog_FeatureFlagsQuery from "../app/commands/posthog/FeatureFlagsQuery.js";
import type * as app_commands_posthog_UpsertFeatureFlagMutation from "../app/commands/posthog/UpsertFeatureFlagMutation.js";
import type * as app_config_apis from "../app/config/apis.js";
import type * as app_config_email from "../app/config/email.js";
import type * as app_config_runner from "../app/config/runner.js";
import type * as app_dataModel from "../app/dataModel.js";
import type * as app_email_Email from "../app/email/Email.js";
import type * as app_email_index from "../app/email/index.js";
import type * as app_email_templates_EmailTemplate from "../app/email/templates/EmailTemplate.js";
import type * as app_functions_extensions_CtxExtension from "../app/functions/extensions/CtxExtension.js";
import type * as app_functions_extensions_CtxExtensionMerger from "../app/functions/extensions/CtxExtensionMerger.js";
import type * as app_functions_extensions_FeatureFlagsCtxExtension from "../app/functions/extensions/FeatureFlagsCtxExtension.js";
import type * as app_functions_extensions_RateLimitCtxExtension from "../app/functions/extensions/RateLimitCtxExtension.js";
import type * as app_functions_extensions_SecretCtxExtension from "../app/functions/extensions/SecretCtxExtension.js";
import type * as app_functions_index from "../app/functions/index.js";
import type * as app_functions_secret from "../app/functions/secret.js";
import type * as app_functions_zod from "../app/functions/zod.js";
import type * as app_main from "../app/main.js";
import type * as app_schema_cache_actions from "../app/schema/cache/actions.js";
import type * as app_schema_files_files from "../app/schema/files/files.js";
import type * as app_schema_gameLocations from "../app/schema/gameLocations.js";
import type * as app_schema_index from "../app/schema/index.js";
import type * as app_schema_posthog_featureFlag from "../app/schema/posthog/featureFlag.js";
import type * as app_utils_FileUrls from "../app/utils/FileUrls.js";
import type * as app_utils_SiteUrls from "../app/utils/SiteUrls.js";
import type * as app_utils_Slugifier from "../app/utils/Slugifier.js";
import type * as components_rateLimiter from "../components/rateLimiter.js";
import type * as crons from "../crons.js";
import type * as files_storage from "../files/storage.js";
import type * as files_workflow_deleteFiles from "../files/workflow/deleteFiles.js";
import type * as http from "../http.js";
import type * as locations from "../locations.js";
import type * as server_cache_actions from "../server/cache/actions.js";
import type * as server_fileStorage from "../server/fileStorage.js";
import type * as server_posthog from "../server/posthog.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "app/apis/FileStorageAPI": typeof app_apis_FileStorageAPI;
  "app/apis/PosthogAPI": typeof app_apis_PosthogAPI;
  "app/apis/RSIAPI": typeof app_apis_RSIAPI;
  "app/apis/index": typeof app_apis_index;
  "app/cache/ActionCache": typeof app_cache_ActionCache;
  "app/cache/index": typeof app_cache_index;
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
  "app/commands/posthog/FeatureFlagQuery": typeof app_commands_posthog_FeatureFlagQuery;
  "app/commands/posthog/FeatureFlagsQuery": typeof app_commands_posthog_FeatureFlagsQuery;
  "app/commands/posthog/UpsertFeatureFlagMutation": typeof app_commands_posthog_UpsertFeatureFlagMutation;
  "app/config/apis": typeof app_config_apis;
  "app/config/email": typeof app_config_email;
  "app/config/runner": typeof app_config_runner;
  "app/dataModel": typeof app_dataModel;
  "app/email/Email": typeof app_email_Email;
  "app/email/index": typeof app_email_index;
  "app/email/templates/EmailTemplate": typeof app_email_templates_EmailTemplate;
  "app/functions/extensions/CtxExtension": typeof app_functions_extensions_CtxExtension;
  "app/functions/extensions/CtxExtensionMerger": typeof app_functions_extensions_CtxExtensionMerger;
  "app/functions/extensions/FeatureFlagsCtxExtension": typeof app_functions_extensions_FeatureFlagsCtxExtension;
  "app/functions/extensions/RateLimitCtxExtension": typeof app_functions_extensions_RateLimitCtxExtension;
  "app/functions/extensions/SecretCtxExtension": typeof app_functions_extensions_SecretCtxExtension;
  "app/functions/index": typeof app_functions_index;
  "app/functions/secret": typeof app_functions_secret;
  "app/functions/zod": typeof app_functions_zod;
  "app/main": typeof app_main;
  "app/schema/cache/actions": typeof app_schema_cache_actions;
  "app/schema/files/files": typeof app_schema_files_files;
  "app/schema/gameLocations": typeof app_schema_gameLocations;
  "app/schema/index": typeof app_schema_index;
  "app/schema/posthog/featureFlag": typeof app_schema_posthog_featureFlag;
  "app/utils/FileUrls": typeof app_utils_FileUrls;
  "app/utils/SiteUrls": typeof app_utils_SiteUrls;
  "app/utils/Slugifier": typeof app_utils_Slugifier;
  "components/rateLimiter": typeof components_rateLimiter;
  crons: typeof crons;
  "files/storage": typeof files_storage;
  "files/workflow/deleteFiles": typeof files_workflow_deleteFiles;
  http: typeof http;
  locations: typeof locations;
  "server/cache/actions": typeof server_cache_actions;
  "server/fileStorage": typeof server_fileStorage;
  "server/posthog": typeof server_posthog;
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
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  workflow: {
    event: {
      create: FunctionReference<
        "mutation",
        "internal",
        { name: string; workflowId: string },
        string
      >;
      send: FunctionReference<
        "mutation",
        "internal",
        {
          eventId?: string;
          name?: string;
          result:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId?: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        string
      >;
    };
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { shortCircuit?: boolean; workflowId: string },
        {
          blocked?: boolean;
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  inProgress: boolean;
                  kind: "sleep";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  inProgress: boolean;
                  kind: "sleep";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step:
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                functionType: "query" | "mutation" | "action";
                handle: string;
                inProgress: boolean;
                kind?: "function";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                handle: string;
                inProgress: boolean;
                kind: "workflow";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workflowId?: string;
              }
            | {
                args: { eventId?: string };
                argsSize: number;
                completedAt?: number;
                eventId?: string;
                inProgress: boolean;
                kind: "event";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                inProgress: boolean;
                kind: "sleep";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workId?: string;
              };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { force?: boolean; workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  inProgress: boolean;
                  kind: "sleep";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            context?: any;
            name?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listByName: FunctionReference<
        "query",
        "internal",
        {
          name: string;
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            context?: any;
            name?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listSteps: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          workflowId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            completedAt?: number;
            eventId?: string;
            kind: "function" | "workflow" | "event" | "sleep";
            name: string;
            nestedWorkflowId?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt: number;
            stepId: string;
            stepNumber: number;
            workId?: string;
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      restart: FunctionReference<
        "mutation",
        "internal",
        { from?: number | string; startAsync?: boolean; workflowId: string },
        null
      >;
    };
  };
};
