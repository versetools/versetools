import { allowlist, denylist } from "svelte-exmarkdown";
import { gfmPlugin } from "svelte-exmarkdown/gfm";

import { breaks } from "./breaks";
import { spoilers } from "./spoilers";
import { strikethroughs } from "./strikethroughs";

export { gfmPlugin as gfm, allowlist, denylist, breaks, spoilers, strikethroughs };
