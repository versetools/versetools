import { createRouteHandlers } from "@l3dev/svelte-api/server";

import { v1_consent_route } from "./route.server";

const { POST } = createRouteHandlers(v1_consent_route);

export { POST };
