import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";
import type {
  LocationPropertyType,
  LocationAmenity,
  LocationResponse,
} from "@versetools/types";
import type { Cursor } from "convex/server";

export const api: PublicApiType = anyApi as unknown as PublicApiType;

export type PublicApiType = {
  locations: {
    findByProperty: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: { cursor: Cursor | null; numItems?: number };
        type: LocationPropertyType;
        value: LocationAmenity;
      },
      {
        continueCursor: Cursor;
        isDone: boolean;
        page: Array<LocationResponse>;
        pageStatus?: "SplitRecommended" | "SplitRequired" | null;
        splitCursor?: Cursor | null;
      }
    >;
    isRebuilding: FunctionReference<"query", "public", any, boolean>;
    list: FunctionReference<
      "query",
      "public",
      { rootIds?: Array<Id<"locations">> },
      Array<LocationResponse>
    >;
  };
};
